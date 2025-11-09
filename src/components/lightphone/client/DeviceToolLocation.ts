import Entity from "app/components/lightphone/client/Entity.js";
import Address from "app/components/lightphone/client/Address.js";
import Relationship from "app/components/lightphone/client/Relationship.js";

export default interface DeviceToolLocation extends Entity<"device_tool_locations">
{
    attributes: {
        id: string,
        user_id: string,
        device_id: string,
        config: {
            latitude: number,
            longitude: number,
            address: Address,
        },
    },
    relationships: {
        device: Relationship.Single<"devices">,
        user: Relationship.Single<"users">,
    },
}