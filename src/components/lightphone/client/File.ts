import Entity from "app/components/lightphone/client/Entity.js";

export default interface File extends Entity<"files">
{
    attributes: {
        bucket: string,
        content_type: string | null,
        key: string,
        presigned_url: string,
        secret: string | null,
        uploaded_at: string | null,
    }
}