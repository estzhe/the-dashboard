import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    title?: string,
    recentItemsToShowInHistory: number;
}