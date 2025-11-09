import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    account: string | undefined;
    repo: string | undefined;
    title: string | undefined;
    filter: string | undefined;
}