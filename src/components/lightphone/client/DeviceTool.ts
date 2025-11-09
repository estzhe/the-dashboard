import Address from "app/components/lightphone/client/Address.js";
import Relationship from "app/components/lightphone/client/Relationship.js";
import Entity from "app/components/lightphone/client/Entity.js";

export default interface DeviceTool extends Entity<"device_tools">
{
    attributes: {
        deleted_at: string | null,
        config: {
            awaiting_migration?: boolean,
            device_tool_location_created?: boolean,
            latitude?: number,
            longitude?: number,
            address?: Address,
        },
    },
    relationships: {
        device: Relationship.Single<"devices">,
        tool: Relationship.Single<"tools">,
    },
}