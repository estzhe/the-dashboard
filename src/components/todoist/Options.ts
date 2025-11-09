import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    title?: string,
    account: string,
    filter: string,
}