using System;
using System.Collections.Generic;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using NzbDrone.Core.Indexers;
using NzbDrone.Core.Indexers.Torznab;
using NzbDrone.Core.Parser.Model;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.IndexerTests
{
    [TestFixture]
    public class SeedConfigProviderFixture : CoreTest<SeedConfigProvider>
    {
        [Test]
        public void should_not_return_config_for_non_existent_indexer()
        {
            Mocker.GetMock<ICachedIndexerSettingsProvider>()
                .Setup(v => v.GetSettings(It.IsAny<int>()))
                .Returns<CachedIndexerSettings>(null);

            var result = Subject.GetSeedConfiguration(new RemoteMovie
            {
                Release = new ReleaseInfo
                {
                    DownloadProtocol = DownloadProtocol.Torrent,
                    IndexerId = 0
                }
            });

            result.Should().BeNull();
        }

        [Test]
        public void should_not_return_config_for_invalid_indexer()
        {
            Mocker.GetMock<ICachedIndexerSettingsProvider>()
                .Setup(v => v.GetSettings(It.IsAny<int>()))
                .Returns<CachedIndexerSettings>(null);

            var result = Subject.GetSeedConfiguration(new RemoteMovie
            {
                Release = new ReleaseInfo
                {
                    DownloadProtocol = DownloadProtocol.Torrent,
                    IndexerId = 1
                },
                ParsedMovieInfo = new ParsedMovieInfo()
            });

            result.Should().BeNull();
        }

        [Test]
        public void should_return_seed_time_for_movies()
        {
            var settings = new TorznabSettings();
            settings.SeedCriteria.SeedTime = 10;

            Mocker.GetMock<ICachedIndexerSettingsProvider>()
                .Setup(v => v.GetSettings(It.IsAny<int>()))
                .Returns(new CachedIndexerSettings
                {
                    FailDownloads = new HashSet<FailDownloads> { FailDownloads.Executables },
                    SeedCriteriaSettings = settings.SeedCriteria
                });

            var result = Subject.GetSeedConfiguration(new RemoteMovie
            {
                Release = new ReleaseInfo
                {
                    DownloadProtocol = DownloadProtocol.Torrent,
                    IndexerId = 1
                },
                ParsedMovieInfo = new ParsedMovieInfo()
            });

            result.Should().NotBeNull();
            result.SeedTime.Should().Be(TimeSpan.FromMinutes(10));
        }
    }
}
