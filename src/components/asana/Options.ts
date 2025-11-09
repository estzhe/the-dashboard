import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    account: string;
    projectId: string;
    sectionRecentlyAssigned: string|undefined;
    sectionToday: string|undefined;
    title: string|undefined;
}