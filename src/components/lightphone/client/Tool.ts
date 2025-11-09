import Entity from "app/components/lightphone/client/Entity.js";

export default interface Tool extends Entity<"tools">
{
    attributes: {
        component: string,
        min_apk_version: number,
        namespace: string,
        status: string,
        title: string,
    },
}