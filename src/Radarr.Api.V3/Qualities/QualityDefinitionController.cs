using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using NzbDrone.Core.Datastore.Events;
using NzbDrone.Core.Messaging.Events;
using NzbDrone.Core.Qualities;
using NzbDrone.SignalR;
using Radarr.Http;
using Radarr.Http.REST;
using Radarr.Http.REST.Attributes;

namespace Radarr.Api.V3.Qualities
{
    [V3ApiController]
    public class QualityDefinitionController :
        RestControllerWithSignalR<QualityDefinitionResource, QualityDefinition>,
        IHandle<CommandExecutedEvent>
    {
        private readonly IQualityDefinitionService _qualityDefinitionService;

        public QualityDefinitionController(
            IQualityDefinitionService qualityDefinitionService,
            IBroadcastSignalRMessage signalRBroadcaster)
            : base(signalRBroadcaster)
        {
            _qualityDefinitionService = qualityDefinitionService;

            SharedValidator.RuleFor(c => c)
                .SetValidator(new QualityDefinitionResourceValidator());
        }

        [RestPutById]
        public ActionResult<QualityDefinitionResource> Update([FromBody] QualityDefinitionResource resource)
        {
            var model = resource.ToModel();
            _qualityDefinitionService.Update(model);
            return Accepted(model.Id);
        }

        protected override QualityDefinitionResource GetResourceById(int id)
        {
            return _qualityDefinitionService.GetById(id).ToResource();
        }

        [HttpGet]
        public List<QualityDefinitionResource> GetAll()
        {
            return _qualityDefinitionService.All().ToResource();
        }

        [HttpPut("update")]
        public object UpdateMany([FromBody] List<QualityDefinitionResource> resource)
        {
            // Read from request
            var qualityDefinitions = resource.ToModel().ToList();

            _qualityDefinitionService.UpdateMany(qualityDefinitions);

            return Accepted(_qualityDefinitionService.All()
                .ToResource());
        }

        [HttpGet("limits")]
        public ActionResult<QualityDefinitionLimitsResource> GetLimits()
        {
            return Ok(new QualityDefinitionLimitsResource(
                QualityDefinitionLimits.Min,
                QualityDefinitionLimits.Max));
        }

        [NonAction]
        public void Handle(CommandExecutedEvent message)
        {
            if (message.Command.Name == "ResetQualityDefinitions")
            {
                BroadcastResourceChange(ModelAction.Sync);
            }
        }
    }
}
