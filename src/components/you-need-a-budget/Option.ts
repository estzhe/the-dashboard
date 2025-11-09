import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Option extends BaseComponentOptions
{
    title?: string,
    account: string,
    budgetId: string,
}