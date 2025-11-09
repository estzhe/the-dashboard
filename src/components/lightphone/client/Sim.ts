import Entity from "app/components/lightphone/client/Entity.js";
import Relationship from "app/components/lightphone/client/Relationship.js";

interface Sim extends Entity<"sims">
{
    attributes: {
        iccid: string,
        phone_number: string,
    },
    relationships: {
        device: Relationship.Single<"devices">,
    },
}