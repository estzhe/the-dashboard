import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    account: string,
    deviceId: string,
    title?: string,
}