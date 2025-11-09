import Entity from "app/components/lightphone/client/Entity.js";
import Relationship from "app/components/lightphone/client/Relationship.js";

export default interface Note extends Entity<"notes">
{
    attributes: {
        device_tool_id: string,
        file_id: string,
        note_type: "text" | "audio",
        
        /**
         * `Untitled` stands for no title.
         */
        title: string,
        
        /**
         * Through experimentation it was found out that `updated_at` is in UTC,
         * but it does not have any timezone information attached to it, nor `Z` at the end.
         */
        updated_at: string,
    },
    relationships: {
        file: Relationship.Single<"files">,
    }
}