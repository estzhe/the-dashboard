import Entity from "app/components/lightphone/client/Entity.js";
import Relationship from "app/components/lightphone/client/Relationship.js";

export default interface Device extends Entity<"devices">
{
    attributes: {
        imei: string,
        sku: string,
        serial_number: string,
        light_os_version_name: string,
    },
    relationships: {
        user: Relationship.Single<"users">,
        sim: Relationship.Single<"sims">,
        device_tools: Relationship.Many<"device_tools">,
        device_tool_location?: Relationship.Single<"device_tool_locations">,
    },
}
