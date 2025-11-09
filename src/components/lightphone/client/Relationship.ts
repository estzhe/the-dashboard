import EntityType from "app/components/lightphone/client/EntityType.js";

namespace Relationship
{
    export interface Single<TEntityType extends EntityType>
    {
        data: Relationship<TEntityType>;
    }
    
    export interface Many<TEntityType extends EntityType>
    {
        data: Relationship<TEntityType>[];
    }
    
    export interface Relationship<TEntityType extends EntityType>
    {
        id: string,
        type: TEntityType,
    }
}

export default Relationship;