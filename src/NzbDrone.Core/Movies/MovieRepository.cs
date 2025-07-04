using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using NzbDrone.Core.Datastore;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.Messaging.Events;
using NzbDrone.Core.Movies.AlternativeTitles;
using NzbDrone.Core.Movies.Translations;
using NzbDrone.Core.Profiles.Qualities;
using NzbDrone.Core.Qualities;

namespace NzbDrone.Core.Movies
{
    public interface IMovieRepository : IBasicRepository<Movie>
    {
        bool MoviePathExists(string path);
        List<Movie> FindByTitles(List<string> titles);
        Movie FindByImdbId(string imdbid);
        Movie FindByTmdbId(int tmdbid);
        List<Movie> FindByTmdbId(List<int> tmdbids);
        List<Movie> MoviesBetweenDates(DateTime start, DateTime end, bool includeUnmonitored);
        PagingSpec<Movie> MoviesWithoutFiles(PagingSpec<Movie> pagingSpec);
        List<Movie> GetMoviesByFileId(int fileId);
        List<Movie> GetMoviesByCollectionTmdbId(int collectionId);
        PagingSpec<Movie> MoviesWhereCutoffUnmet(PagingSpec<Movie> pagingSpec, List<QualitiesBelowCutoff> qualitiesBelowCutoff);
        Movie FindByPath(string path);
        Dictionary<int, string> AllMoviePaths();
        List<int> AllMovieTmdbIds();
        Dictionary<int, List<int>> AllMovieTags();
        List<int> GetRecommendations();
        bool ExistsByMetadataId(int metadataId);
        HashSet<int> AllMovieWithCollectionsTmdbIds();
    }

    public class MovieRepository : BasicRepository<Movie>, IMovieRepository
    {
        private readonly IQualityProfileRepository _profileRepository;
        private readonly IAlternativeTitleRepository _alternativeTitleRepository;

        public MovieRepository(IMainDatabase database,
                               IQualityProfileRepository profileRepository,
                               IAlternativeTitleRepository alternativeTitleRepository,
                               IEventAggregator eventAggregator)
            : base(database, eventAggregator)
        {
            _profileRepository = profileRepository;
            _alternativeTitleRepository = alternativeTitleRepository;
        }

        protected override IEnumerable<Movie> PagedQuery(SqlBuilder builder) =>
            _database.QueryJoined<Movie, MovieMetadata>(builder, (movie, movieMetadata) =>
            {
                movie.MovieMetadata = movieMetadata;
                return movie;
            });

        protected override SqlBuilder Builder() => new SqlBuilder(_database.DatabaseType)
            .Join<Movie, QualityProfile>((m, p) => m.QualityProfileId == p.Id)
            .Join<Movie, MovieMetadata>((m, p) => m.MovieMetadataId == p.Id)
            .LeftJoin<Movie, MovieFile>((m, f) => m.Id == f.MovieId)
            .LeftJoin<MovieMetadata, AlternativeTitle>((mm, t) => mm.Id == t.MovieMetadataId);

        private Movie Map(Dictionary<int, Movie> dict, Movie movie, MovieMetadata metadata, QualityProfile qualityProfile, MovieFile movieFile, AlternativeTitle altTitle = null, MovieTranslation translation = null)
        {
            if (!dict.TryGetValue(movie.Id, out var movieEntry))
            {
                movieEntry = movie;
                movieEntry.MovieMetadata = metadata;
                movieEntry.QualityProfile = qualityProfile;
                movieEntry.MovieFile = movieFile;
                dict.Add(movieEntry.Id, movieEntry);
            }

            if (altTitle != null)
            {
                movieEntry.MovieMetadata.Value.AlternativeTitles.Add(altTitle);
            }

            if (translation != null)
            {
                movieEntry.MovieMetadata.Value.Translations.Add(translation);
            }

            return movieEntry;
        }

        protected override List<Movie> Query(SqlBuilder builder)
        {
            var movieDictionary = new Dictionary<int, Movie>();

            _ = _database.QueryJoined<Movie, MovieMetadata, QualityProfile, MovieFile, AlternativeTitle>(
                builder,
                (movie, metadata, qualityProfile, file, altTitle) => Map(movieDictionary, movie, metadata, qualityProfile, file, altTitle));

            return movieDictionary.Values.ToList();
        }

        public override IEnumerable<Movie> All()
        {
            // the skips the join on profile and alternative title and populates manually
            // to avoid repeatedly deserializing the same profile / movie
            var builder = new SqlBuilder(_database.DatabaseType)
                .LeftJoin<Movie, MovieMetadata>((m, f) => m.MovieMetadataId == f.Id)
                .LeftJoin<Movie, MovieFile>((m, f) => m.MovieFileId == f.Id);

            var qualityProfiles = _profileRepository.All().ToDictionary(x => x.Id);
            var alternativeTitles = _alternativeTitleRepository.All()
                .GroupBy(x => x.MovieMetadataId)
                .ToDictionary(x => x.Key, y => y.ToList());

            return _database.QueryJoined<Movie, MovieMetadata, MovieFile>(
                builder,
                (movie, metadata, file) =>
                {
                    movie.MovieMetadata = metadata;
                    movie.MovieFile = file;
                    movie.QualityProfile = qualityProfiles[movie.QualityProfileId];

                    if (alternativeTitles.TryGetValue(movie.MovieMetadataId, out var altTitles))
                    {
                        movie.MovieMetadata.Value.AlternativeTitles = altTitles;
                    }

                    return movie;
                });
        }

        public bool MoviePathExists(string path)
        {
            return Query(x => x.Path == path).Any();
        }

        public List<Movie> FindByTitles(List<string> titles)
        {
            var distinct = titles.Distinct().ToList();

            var results = new List<Movie>();

            results.AddRange(FindByMovieTitles(distinct));
            results.AddRange(FindByAltTitles(distinct));
            results.AddRange(FindByTransTitles(distinct));

            return results.DistinctBy(x => x.Id).ToList();
        }

        // This is a bit of a hack, but if you try to combine / rationalise these then
        // SQLite makes a mess of the query plan and ends up doing a table scan
        private List<Movie> FindByMovieTitles(List<string> titles)
        {
            var movieDictionary = new Dictionary<int, Movie>();

            var builder = new SqlBuilder(_database.DatabaseType)
                .Join<Movie, QualityProfile>((m, p) => m.QualityProfileId == p.Id)
                .Join<Movie, MovieMetadata>((m, p) => m.MovieMetadataId == p.Id)
                .LeftJoin<Movie, MovieFile>((m, f) => m.Id == f.MovieId)
                .Where<MovieMetadata>(x => titles.Contains(x.CleanTitle) || titles.Contains(x.CleanOriginalTitle));

            _ = _database.QueryJoined<Movie, MovieMetadata, QualityProfile, MovieFile>(
                builder,
                (movie, metadata, qualityProfile, file) => Map(movieDictionary, movie, metadata, qualityProfile, file));

            return movieDictionary.Values.ToList();
        }

        private List<Movie> FindByAltTitles(List<string> titles)
        {
            var movieDictionary = new Dictionary<int, Movie>();

            var builder = new SqlBuilder(_database.DatabaseType)
                .Join<AlternativeTitle, MovieMetadata>((t, mm) => t.MovieMetadataId == mm.Id)
                .Join<MovieMetadata, Movie>((mm, m) => mm.Id == m.MovieMetadataId)
                .Join<Movie, QualityProfile>((m, p) => m.QualityProfileId == p.Id)
                .LeftJoin<Movie, MovieFile>((m, f) => m.Id == f.MovieId)
                .Where<AlternativeTitle>(x => titles.Contains(x.CleanTitle));

            _ = _database.QueryJoined<AlternativeTitle, QualityProfile, Movie, MovieMetadata, MovieFile>(
                builder,
                (altTitle, qualityProfile, movie, metadata, file) =>
                {
                    _ = Map(movieDictionary, movie, metadata, qualityProfile, file, altTitle);
                    return null;
                });

            return movieDictionary.Values.ToList();
        }

        private List<Movie> FindByTransTitles(List<string> titles)
        {
            var movieDictionary = new Dictionary<int, Movie>();

            var builder = new SqlBuilder(_database.DatabaseType)
                .Join<MovieTranslation, MovieMetadata>((t, mm) => t.MovieMetadataId == mm.Id)
                .Join<MovieMetadata, Movie>((mm, m) => mm.Id == m.MovieMetadataId)
                .Join<Movie, QualityProfile>((m, p) => m.QualityProfileId == p.Id)
                .LeftJoin<Movie, MovieFile>((m, f) => m.Id == f.MovieId)
                .Where<MovieTranslation>(x => titles.Contains(x.CleanTitle));

            _ = _database.QueryJoined<MovieTranslation, QualityProfile, Movie, MovieMetadata, MovieFile>(
                builder,
                (trans, qualityProfile, movie, metadata, file) =>
                {
                    _ = Map(movieDictionary, movie, metadata, qualityProfile, file, null, trans);
                    return null;
                });

            return movieDictionary.Values.ToList();
        }

        public Movie FindByImdbId(string imdbid)
        {
            var imdbIdWithPrefix = Parser.Parser.NormalizeImdbId(imdbid);
            return imdbIdWithPrefix == null ? null : Query(x => x.MovieMetadata.Value.ImdbId == imdbIdWithPrefix).FirstOrDefault();
        }

        public Movie FindByTmdbId(int tmdbid)
        {
            return Query(x => x.MovieMetadata.Value.TmdbId == tmdbid).FirstOrDefault();
        }

        public List<Movie> FindByTmdbId(List<int> tmdbids)
        {
            return Query(x => tmdbids.Contains(x.TmdbId));
        }

        public List<Movie> GetMoviesByFileId(int fileId)
        {
            return Query(x => x.MovieFileId == fileId);
        }

        public List<Movie> GetMoviesByCollectionTmdbId(int collectionId)
        {
            return Query(x => x.MovieMetadata.Value.CollectionTmdbId == collectionId);
        }

        public List<Movie> MoviesBetweenDates(DateTime start, DateTime end, bool includeUnmonitored)
        {
            var builder = Builder()
                .Where<Movie>(m =>
                              (m.MovieMetadata.Value.InCinemas >= start && m.MovieMetadata.Value.InCinemas <= end) ||
                              (m.MovieMetadata.Value.PhysicalRelease >= start && m.MovieMetadata.Value.PhysicalRelease <= end) ||
                              (m.MovieMetadata.Value.DigitalRelease >= start && m.MovieMetadata.Value.DigitalRelease <= end));

            if (!includeUnmonitored)
            {
                builder.Where<Movie>(x => x.Monitored == true);
            }

            return Query(builder);
        }

        public SqlBuilder MoviesWithoutFilesBuilder() => Builder()
            .Where<Movie>(x => x.MovieFileId == 0)
            .Where<Movie>(m => m.MovieMetadata.Value.Year > 0)
            .GroupBy<Movie>(m => m.Id)
            .GroupBy<MovieMetadata>(m => m.Id);

        public PagingSpec<Movie> MoviesWithoutFiles(PagingSpec<Movie> pagingSpec)
        {
            pagingSpec.Records = GetPagedRecords(MoviesWithoutFilesBuilder(), pagingSpec, PagedQuery);
            pagingSpec.TotalRecords = GetPagedRecordCount(MoviesWithoutFilesBuilder().SelectCountDistinct<Movie>(x => x.Id), pagingSpec);

            return pagingSpec;
        }

        public SqlBuilder MoviesWhereCutoffUnmetBuilder(List<QualitiesBelowCutoff> qualitiesBelowCutoff) => Builder()
            .Where<Movie>(x => x.MovieFileId != 0)
            .Where(BuildQualityCutoffWhereClause(qualitiesBelowCutoff))
            .GroupBy<Movie>(m => m.Id)
            .GroupBy<MovieMetadata>(m => m.Id);

        public PagingSpec<Movie> MoviesWhereCutoffUnmet(PagingSpec<Movie> pagingSpec, List<QualitiesBelowCutoff> qualitiesBelowCutoff)
        {
            pagingSpec.Records = GetPagedRecords(MoviesWhereCutoffUnmetBuilder(qualitiesBelowCutoff), pagingSpec, PagedQuery);
            pagingSpec.TotalRecords = GetPagedRecordCount(MoviesWhereCutoffUnmetBuilder(qualitiesBelowCutoff).SelectCountDistinct<Movie>(x => x.Id), pagingSpec);

            return pagingSpec;
        }

        private string BuildQualityCutoffWhereClause(List<QualitiesBelowCutoff> qualitiesBelowCutoff)
        {
            var clauses = new List<string>();

            foreach (var profile in qualitiesBelowCutoff)
            {
                foreach (var belowCutoff in profile.QualityIds)
                {
                    clauses.Add(string.Format($"(\"{_table}\".\"QualityProfileId\" = {profile.ProfileId} AND \"MovieFiles\".\"Quality\" LIKE '%_quality_: {belowCutoff},%')"));
                }
            }

            return string.Format("({0})", string.Join(" OR ", clauses));
        }

        public Movie FindByPath(string path)
        {
            return Query(x => x.Path == path).FirstOrDefault();
        }

        public Dictionary<int, string> AllMoviePaths()
        {
            using (var conn = _database.OpenConnection())
            {
                var strSql = "SELECT \"Id\" AS \"Key\", \"Path\" AS \"Value\" FROM \"Movies\"";
                return conn.Query<KeyValuePair<int, string>>(strSql).ToDictionary(x => x.Key, x => x.Value);
            }
        }

        public List<int> AllMovieTmdbIds()
        {
            using (var conn = _database.OpenConnection())
            {
                return conn.Query<int>("SELECT \"TmdbId\" FROM \"MovieMetadata\" JOIN \"Movies\" ON (\"Movies\".\"MovieMetadataId\" = \"MovieMetadata\".\"Id\")").ToList();
            }
        }

        public Dictionary<int, List<int>> AllMovieTags()
        {
            using (var conn = _database.OpenConnection())
            {
                var strSql = "SELECT \"Id\" AS \"Key\", \"Tags\" AS \"Value\" FROM \"Movies\" WHERE \"Tags\" IS NOT NULL";
                return conn.Query<KeyValuePair<int, List<int>>>(strSql).ToDictionary(x => x.Key, x => x.Value);
            }
        }

        public List<int> GetRecommendations()
        {
            var recommendations = new List<int>();

            if (_database.DatabaseType == DatabaseType.SQLite && _database.Version < new Version("3.9.0"))
            {
                return recommendations;
            }

            using (var conn = _database.OpenConnection())
            {
                if (_database.DatabaseType == DatabaseType.PostgreSQL)
                {
                    recommendations = conn.Query<int>(@"SELECT DISTINCT ""Rec"" FROM (
                                                    SELECT DISTINCT ""Rec"" FROM
                                                    (
                                                    SELECT DISTINCT CAST(""value"" AS INT) AS ""Rec"" FROM ""MovieMetadata"" JOIN ""Movies"" ON ""Movies"".""MovieMetadataId"" = ""MovieMetadata"".""Id"", json_array_elements_text((""MovieMetadata"".""Recommendations"")::json)
                                                    WHERE CAST(""value"" AS INT) NOT IN (SELECT ""TmdbId"" FROM ""MovieMetadata"" union SELECT ""TmdbId"" from ""ImportExclusions"" as sub1) LIMIT 10
                                                    ) as sub2
                                                    UNION
                                                    SELECT ""Rec"" FROM
                                                    (
                                                    SELECT CAST(""value"" AS INT) AS ""Rec"" FROM ""MovieMetadata"" JOIN ""Movies"" ON ""Movies"".""MovieMetadataId"" = ""MovieMetadata"".""Id"", json_array_elements_text((""MovieMetadata"".""Recommendations"")::json)
                                                    WHERE CAST(""value"" AS INT) NOT IN (SELECT ""TmdbId"" FROM ""MovieMetadata"" union SELECT ""TmdbId"" from ""ImportExclusions"" as sub2)
                                                    GROUP BY ""Rec"" ORDER BY count(*) DESC LIMIT 120
                                                    ) as sub4
                                                    ) as sub5
                                                    LIMIT 100;").ToList();
                }
                else
                {
                    recommendations = conn.Query<int>(@"SELECT DISTINCT ""Rec"" FROM (
                                                    SELECT DISTINCT ""Rec"" FROM
                                                    (
                                                    SELECT DISTINCT CAST(""j"".""value"" AS INT) AS ""Rec"" FROM ""MovieMetadata"" JOIN ""Movies"" ON ""Movies"".""MovieMetadataId"" == ""MovieMetadata"".""Id""
                                                    CROSS JOIN json_each(""MovieMetadata"".""Recommendations"") AS ""j""
                                                    WHERE ""Rec"" NOT IN (SELECT ""TmdbId"" FROM ""MovieMetadata"" union SELECT ""TmdbId"" from ""ImportExclusions"") LIMIT 10
                                                    )
                                                    UNION
                                                    SELECT ""Rec"" FROM
                                                    (
                                                    SELECT CAST(""j"".""value"" AS INT) AS ""Rec"" FROM ""MovieMetadata"" JOIN ""Movies"" ON ""Movies"".""MovieMetadataId"" == ""MovieMetadata"".""Id""
                                                    CROSS JOIN json_each(""MovieMetadata"".""Recommendations"") AS ""j""
                                                    WHERE ""Rec"" NOT IN (SELECT ""TmdbId"" FROM ""MovieMetadata"" union SELECT ""TmdbId"" from ""ImportExclusions"")
                                                    GROUP BY ""Rec"" ORDER BY count(*) DESC LIMIT 120
                                                    )
                                                    )
                                                    LIMIT 100;").ToList();
                }
            }

            return recommendations;
        }

        public bool ExistsByMetadataId(int metadataId)
        {
            return Query(x => x.MovieMetadataId == metadataId).Any();
        }

        public HashSet<int> AllMovieWithCollectionsTmdbIds()
        {
            using var conn = _database.OpenConnection();

            return conn.Query<int>("SELECT \"TmdbId\" FROM \"MovieMetadata\" JOIN \"Movies\" ON (\"Movies\".\"MovieMetadataId\" = \"MovieMetadata\".\"Id\") WHERE \"CollectionTmdbId\" > 0").ToHashSet();
        }
    }
}
