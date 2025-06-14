using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NLog;
using NzbDrone.Common.Cache;
using NzbDrone.Common.Disk;
using NzbDrone.Common.Extensions;
using NzbDrone.Core.Download;

namespace NzbDrone.Core.RemotePathMappings
{
    public interface IRemotePathMappingService
    {
        List<RemotePathMapping> All();
        RemotePathMapping Add(RemotePathMapping mapping);
        void Remove(int id);
        RemotePathMapping Get(int id);
        RemotePathMapping Update(RemotePathMapping mapping);

        OsPath RemapRemoteToLocal(string host, OsPath remotePath);
        OsPath RemapLocalToRemote(string host, OsPath localPath);
    }

    public class RemotePathMappingService : IRemotePathMappingService
    {
        private readonly IRemotePathMappingRepository _remotePathMappingRepository;
        private readonly IDiskProvider _diskProvider;
        private readonly Logger _logger;

        private readonly ICached<List<RemotePathMapping>> _cache;

        public RemotePathMappingService(IDownloadClientRepository downloadClientRepository,
                                        IRemotePathMappingRepository remotePathMappingRepository,
                                        IDiskProvider diskProvider,
                                        ICacheManager cacheManager,
                                        Logger logger)
        {
            _remotePathMappingRepository = remotePathMappingRepository;
            _diskProvider = diskProvider;
            _logger = logger;

            _cache = cacheManager.GetCache<List<RemotePathMapping>>(GetType());
        }

        public List<RemotePathMapping> All()
        {
            return _cache.Get("all", () => _remotePathMappingRepository.All().ToList(), TimeSpan.FromSeconds(10));
        }

        public RemotePathMapping Add(RemotePathMapping mapping)
        {
            mapping.LocalPath = new OsPath(mapping.LocalPath.Trim()).AsDirectory().FullPath;
            mapping.RemotePath = new OsPath(mapping.RemotePath.Trim()).AsDirectory().FullPath;

            var all = All();

            ValidateMapping(all, mapping);

            var result = _remotePathMappingRepository.Insert(mapping);

            _cache.Clear();

            return result;
        }

        public void Remove(int id)
        {
            _remotePathMappingRepository.Delete(id);

            _cache.Clear();
        }

        public RemotePathMapping Get(int id)
        {
            return _remotePathMappingRepository.Get(id);
        }

        public RemotePathMapping Update(RemotePathMapping mapping)
        {
            var existing = All().Where(v => v.Id != mapping.Id).ToList();

            ValidateMapping(existing, mapping);

            var result = _remotePathMappingRepository.Update(mapping);

            _cache.Clear();

            return result;
        }

        private void ValidateMapping(List<RemotePathMapping> existing, RemotePathMapping mapping)
        {
            if (mapping.Host.IsNullOrWhiteSpace())
            {
                throw new ArgumentException("Invalid Host");
            }

            if (mapping.RemotePath.StartsWith(" "))
            {
                throw new ArgumentException("Remote Path must not start with a space");
            }

            var remotePath = new OsPath(mapping.RemotePath);
            var localPath = new OsPath(mapping.LocalPath);

            if (remotePath.IsEmpty)
            {
                throw new ArgumentException("Invalid RemotePath. RemotePath cannot be empty.");
            }

            if (localPath.IsEmpty || !localPath.IsRooted)
            {
                throw new ArgumentException("Invalid LocalPath. LocalPath cannot be empty and must not be the root.");
            }

            if (!_diskProvider.FolderExists(localPath.FullPath))
            {
                throw new DirectoryNotFoundException("Can't add mount point directory that doesn't exist.");
            }

            if (existing.Exists(r => r.Host == mapping.Host && r.RemotePath == mapping.RemotePath))
            {
                throw new InvalidOperationException("RemotePath already configured.");
            }
        }

        public OsPath RemapRemoteToLocal(string host, OsPath remotePath)
        {
            if (remotePath.IsEmpty)
            {
                return remotePath;
            }

            var mappings = All();

            if (mappings.Empty())
            {
                return remotePath;
            }

            _logger.Trace("Evaluating remote path remote mappings for match to host [{0}] and remote path [{1}]", host, remotePath.FullPath);

            foreach (var mapping in mappings)
            {
                _logger.Trace("Checking configured remote path mapping: {0} - {1}", mapping.Host, mapping.RemotePath);
                if (host.Equals(mapping.Host, StringComparison.InvariantCultureIgnoreCase) && new OsPath(mapping.RemotePath).Contains(remotePath))
                {
                    var localPath = new OsPath(mapping.LocalPath) + (remotePath - new OsPath(mapping.RemotePath));
                    _logger.Debug("Remapped remote path [{0}] to local path [{1}] for host [{2}]", remotePath, localPath, host);

                    return localPath;
                }
            }

            return remotePath;
        }

        public OsPath RemapLocalToRemote(string host, OsPath localPath)
        {
            if (localPath.IsEmpty)
            {
                return localPath;
            }

            var mappings = All();

            if (mappings.Empty())
            {
                return localPath;
            }

            _logger.Trace("Evaluating remote path local mappings for match to host [{0}] and local path [{1}]", host, localPath.FullPath);

            foreach (var mapping in mappings)
            {
                _logger.Trace("Checking configured remote path mapping {0} - {1}", mapping.Host, mapping.RemotePath);
                if (host.Equals(mapping.Host, StringComparison.InvariantCultureIgnoreCase) && new OsPath(mapping.LocalPath).Contains(localPath))
                {
                    var remotePath = new OsPath(mapping.RemotePath) + (localPath - new OsPath(mapping.LocalPath));
                    _logger.Debug("Remapped local path [{0}] to remote path [{1}] for host [{2}]", localPath, remotePath, host);

                    return remotePath;
                }
            }

            return localPath;
        }
    }
}
