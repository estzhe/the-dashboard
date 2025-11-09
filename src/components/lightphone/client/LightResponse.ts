import EntityType from "app/components/lightphone/client/EntityType.js";
import Entity from "app/components/lightphone/client/Entity.js";

export default interface LightResponse<TEntity extends Entity<EntityType>>
{
    data: TEntity[],
    included?: Entity<EntityType>[],
    jsonapi: {
        version: string,
    },
}