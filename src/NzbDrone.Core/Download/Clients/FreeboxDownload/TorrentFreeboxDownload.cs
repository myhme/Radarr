using System;
using System.Collections.Generic;
using System.Linq;
using FluentValidation.Results;
using NLog;
using NzbDrone.Common.Disk;
using NzbDrone.Common.Extensions;
using NzbDrone.Common.Http;
using NzbDrone.Core.Blocklisting;
using NzbDrone.Core.Configuration;
using NzbDrone.Core.Download.Clients.FreeboxDownload.Responses;
using NzbDrone.Core.Localization;
using NzbDrone.Core.MediaFiles.TorrentInfo;
using NzbDrone.Core.Parser.Model;
using NzbDrone.Core.RemotePathMappings;

namespace NzbDrone.Core.Download.Clients.FreeboxDownload
{
    public class TorrentFreeboxDownload : TorrentClientBase<FreeboxDownloadSettings>
    {
        private readonly IFreeboxDownloadProxy _proxy;

        public TorrentFreeboxDownload(IFreeboxDownloadProxy proxy,
            ITorrentFileInfoReader torrentFileInfoReader,
            IHttpClient httpClient,
            IConfigService configService,
            IDiskProvider diskProvider,
            IRemotePathMappingService remotePathMappingService,
            ILocalizationService localizationService,
            IBlocklistService blocklistService,
            Logger logger)
            : base(torrentFileInfoReader, httpClient, configService, diskProvider, remotePathMappingService, localizationService, blocklistService, logger)
        {
            _proxy = proxy;
        }

        public override string Name => "Freebox Download";

        protected IEnumerable<FreeboxDownloadTask> GetTorrents()
        {
            return _proxy.GetTasks(Settings).Where(v => v.Type.ToLower() == FreeboxDownloadTaskType.Bt.ToString().ToLower());
        }

        public override IEnumerable<DownloadClientItem> GetItems()
        {
            var torrents = GetTorrents();

            var queueItems = new List<DownloadClientItem>();

            foreach (var torrent in torrents)
            {
                var outputPath = new OsPath(torrent.DecodedDownloadDirectory);

                if (Settings.DestinationDirectory.IsNotNullOrWhiteSpace())
                {
                    if (!new OsPath(Settings.DestinationDirectory).Contains(outputPath))
                    {
                        continue;
                    }
                }

                if (Settings.Category.IsNotNullOrWhiteSpace())
                {
                    var directories = outputPath.FullPath.Split('\\', '/');

                    if (!directories.Contains(Settings.Category))
                    {
                        continue;
                    }
                }

                var item = new DownloadClientItem()
                {
                    DownloadId = torrent.Id,
                    Category = Settings.Category,
                    Title = torrent.Name,
                    TotalSize = torrent.Size,
                    DownloadClientInfo = DownloadClientItemClientInfo.FromDownloadClient(this, false),
                    RemainingSize = (long)(torrent.Size * (double)(1 - ((double)torrent.ReceivedPrct / 10000))),
                    RemainingTime = torrent.Eta <= 0 ? null : TimeSpan.FromSeconds(torrent.Eta),
                    SeedRatio = torrent.StopRatio <= 0 ? 0 : torrent.StopRatio / 100,
                    OutputPath = _remotePathMappingService.RemapRemoteToLocal(Settings.Host, outputPath)
                };

                switch (torrent.Status)
                {
                    case FreeboxDownloadTaskStatus.Stopped: // task is stopped, can be resumed by setting the status to downloading
                    case FreeboxDownloadTaskStatus.Stopping: // task is gracefully stopping
                        item.Status = DownloadItemStatus.Paused;
                        break;

                    case FreeboxDownloadTaskStatus.Queued: // task will start when a new download slot is available the queue position is stored in queue_pos attribute
                        item.Status = DownloadItemStatus.Queued;
                        break;

                    case FreeboxDownloadTaskStatus.Starting: // task is preparing to start download
                    case FreeboxDownloadTaskStatus.Downloading:
                    case FreeboxDownloadTaskStatus.Retry: // you can set a task status to ‘retry’ to restart the download task.
                    case FreeboxDownloadTaskStatus.Checking: // checking data before launching download.
                        item.Status = DownloadItemStatus.Downloading;
                        break;

                    case FreeboxDownloadTaskStatus.Error: // there was a problem with the download, you can get an error code in the error field
                        item.Status = DownloadItemStatus.Warning;
                        item.Message = torrent.GetErrorDescription();
                        break;

                    case FreeboxDownloadTaskStatus.Done: // the download is over. For bt you can resume seeding setting the status to seeding if the ratio is not reached yet
                    case FreeboxDownloadTaskStatus.Seeding: // download is over, the content is Change to being shared to other users. The task will automatically stop once the seed ratio has been reached
                        item.Status = DownloadItemStatus.Completed;
                        break;

                    case FreeboxDownloadTaskStatus.Unknown:
                    default: // new status in API? default to downloading
                        item.Message = _localizationService.GetLocalizedString("UnknownDownloadState",
                            new Dictionary<string, object> { { "state", torrent.Status } });
                        _logger.Info($"Unknown download state: {torrent.Status}");
                        item.Status = DownloadItemStatus.Downloading;
                        break;
                }

                item.CanBeRemoved = item.CanMoveFiles = item.DownloadClientInfo.RemoveCompletedDownloads && torrent.Status == FreeboxDownloadTaskStatus.Done;

                queueItems.Add(item);
            }

            return queueItems;
        }

        protected override string AddFromMagnetLink(RemoteMovie remoteMovie, string hash, string magnetLink)
        {
            return _proxy.AddTaskFromUrl(magnetLink,
                                         GetDownloadDirectory().EncodeBase64(),
                                         ToBePaused(),
                                         ToBeQueuedFirst(remoteMovie),
                                         GetSeedRatio(remoteMovie),
                                         Settings);
        }

        protected override string AddFromTorrentFile(RemoteMovie remoteMovie, string hash, string filename, byte[] fileContent)
        {
            return _proxy.AddTaskFromFile(filename,
                                          fileContent,
                                          GetDownloadDirectory().EncodeBase64(),
                                          ToBePaused(),
                                          ToBeQueuedFirst(remoteMovie),
                                          GetSeedRatio(remoteMovie),
                                          Settings);
        }

        public override void RemoveItem(DownloadClientItem item, bool deleteData)
        {
            _proxy.DeleteTask(item.DownloadId, deleteData, Settings);
        }

        public override DownloadClientInfo GetStatus()
        {
            var destDir = GetDownloadDirectory();

            return new DownloadClientInfo
            {
                IsLocalhost = Settings.Host == "127.0.0.1" || Settings.Host == "::1" || Settings.Host == "localhost",
                OutputRootFolders = new List<OsPath> { _remotePathMappingService.RemapRemoteToLocal(Settings.Host, new OsPath(destDir)) }
            };
        }

        protected override void Test(List<ValidationFailure> failures)
        {
            try
            {
                _proxy.Authenticate(Settings);
            }
            catch (DownloadClientUnavailableException ex)
            {
                failures.Add(new ValidationFailure("Host", ex.Message));
                failures.Add(new ValidationFailure("Port", ex.Message));
            }
            catch (DownloadClientAuthenticationException ex)
            {
                failures.Add(new ValidationFailure("AppId", ex.Message));
                failures.Add(new ValidationFailure("AppToken", ex.Message));
            }
            catch (FreeboxDownloadException ex)
            {
                failures.Add(new ValidationFailure("ApiUrl", ex.Message));
            }
        }

        private string GetDownloadDirectory()
        {
            if (Settings.DestinationDirectory.IsNotNullOrWhiteSpace())
            {
                return Settings.DestinationDirectory.TrimEnd('/');
            }

            var destDir = _proxy.GetDownloadConfiguration(Settings).DecodedDownloadDirectory.TrimEnd('/');

            if (Settings.Category.IsNotNullOrWhiteSpace())
            {
                destDir = $"{destDir}/{Settings.Category}";
            }

            return destDir;
        }

        private bool ToBePaused()
        {
            return Settings.AddPaused;
        }

        private bool ToBeQueuedFirst(RemoteMovie remoteMovie)
        {
            var isRecentMovie = remoteMovie.Movie.MovieMetadata.Value.IsRecentMovie;

            if ((isRecentMovie && Settings.RecentPriority == (int)FreeboxDownloadPriority.First) ||
                (!isRecentMovie && Settings.OlderPriority == (int)FreeboxDownloadPriority.First))
            {
                return true;
            }

            return false;
        }

        private double? GetSeedRatio(RemoteMovie remoteMovie)
        {
            if (remoteMovie.SeedConfiguration == null || remoteMovie.SeedConfiguration.Ratio == null)
            {
                return null;
            }

            return remoteMovie.SeedConfiguration.Ratio.Value * 100;
        }
    }
}
