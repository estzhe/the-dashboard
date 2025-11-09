import EntityType from "app/components/lightphone/client/EntityType.js";

export default interface Entity<TEntityType extends EntityType>
{
    id: string,
    type: TEntityType,
}