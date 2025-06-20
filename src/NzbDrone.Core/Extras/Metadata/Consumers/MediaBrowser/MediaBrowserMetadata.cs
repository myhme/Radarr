using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using NLog;
using NzbDrone.Common.Extensions;
using NzbDrone.Core.Extras.Metadata.Files;
using NzbDrone.Core.Localization;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.Movies;
using NzbDrone.Core.ThingiProvider;

namespace NzbDrone.Core.Extras.Metadata.Consumers.MediaBrowser
{
    public class MediaBrowserMetadata : MetadataBase<MediaBrowserMetadataSettings>
    {
        private readonly ILocalizationService _localizationService;
        private readonly Logger _logger;

        public MediaBrowserMetadata(ILocalizationService localizationService, Logger logger)
        {
            _localizationService = localizationService;
            _logger = logger;
        }

        public override string Name => "Emby (Legacy)";

        public override ProviderMessage Message => new (_localizationService.GetLocalizedString("MetadataMediaBrowserDeprecated", new Dictionary<string, object> { { "version", "v6" } }), ProviderMessageType.Warning);

        public override MetadataFile FindMetadataFile(Movie movie, string path)
        {
            var filename = Path.GetFileName(path);

            if (filename == null)
            {
                return null;
            }

            var metadata = new MetadataFile
            {
                MovieId = movie.Id,
                Consumer = GetType().Name,
                RelativePath = movie.Path.GetRelativePath(path)
            };

            if (filename.Equals("movie.xml", StringComparison.InvariantCultureIgnoreCase))
            {
                metadata.Type = MetadataType.MovieMetadata;
                return metadata;
            }

            return null;
        }

        public override MetadataFileResult MovieMetadata(Movie movie, MovieFile movieFile)
        {
            if (!Settings.MovieMetadata)
            {
                return null;
            }

            _logger.Debug("Generating movie.xml for: {0}", movie.Title);
            var sb = new StringBuilder();
            var xws = new XmlWriterSettings();
            xws.OmitXmlDeclaration = true;
            xws.Indent = false;

            using (var xw = XmlWriter.Create(sb, xws))
            {
                var movieElement = new XElement("Movie");

                movieElement.Add(new XElement("id", movie.MovieMetadata.Value.ImdbId));
                movieElement.Add(new XElement("Status", movie.MovieMetadata.Value.Status));

                movieElement.Add(new XElement("Added", movie.Added.ToString("MM/dd/yyyy HH:mm:ss tt")));
                movieElement.Add(new XElement("LockData", "false"));
                movieElement.Add(new XElement("Overview", movie.MovieMetadata.Value.Overview));
                movieElement.Add(new XElement("LocalTitle", movie.Title));

                movieElement.Add(new XElement("Rating", movie.MovieMetadata.Value.Ratings.Tmdb?.Value ?? 0));
                movieElement.Add(new XElement("ProductionYear", movie.Year));
                movieElement.Add(new XElement("RunningTime", movie.MovieMetadata.Value.Runtime));
                movieElement.Add(new XElement("IMDB", movie.MovieMetadata.Value.ImdbId));
                movieElement.Add(new XElement("Genres", movie.MovieMetadata.Value.Genres.Select(genre => new XElement("Genre", genre))));

                var doc = new XDocument(movieElement);
                doc.Save(xw);

                _logger.Debug("Saving movie.xml for {0}", movie.Title);

                return new MetadataFileResult("movie.xml", doc.ToString());
            }
        }

        public override List<ImageFileResult> MovieImages(Movie movie)
        {
            return new List<ImageFileResult>();
        }

        private IEnumerable<ImageFileResult> ProcessMovieImages(Movie movie)
        {
            return new List<ImageFileResult>();
        }
    }
}
