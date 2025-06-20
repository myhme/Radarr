using FluentValidation;
using NzbDrone.Core.Indexers;
using NzbDrone.Core.Validation;
using NzbDrone.SignalR;
using Radarr.Http;

namespace Radarr.Api.V3.Indexers
{
    [V3ApiController]
    public class IndexerController : ProviderControllerBase<IndexerResource, IndexerBulkResource, IIndexer, IndexerDefinition>
    {
        public static readonly IndexerResourceMapper ResourceMapper = new ();
        public static readonly IndexerBulkResourceMapper BulkResourceMapper = new ();

        public IndexerController(IBroadcastSignalRMessage signalRBroadcaster,
            IndexerFactory indexerFactory,
            DownloadClientExistsValidator downloadClientExistsValidator)
            : base(signalRBroadcaster, indexerFactory, "indexer", ResourceMapper, BulkResourceMapper)
        {
            SharedValidator.RuleFor(c => c.Priority).InclusiveBetween(1, 50);
            SharedValidator.RuleFor(c => c.DownloadClientId).SetValidator(downloadClientExistsValidator);
        }
    }
}
