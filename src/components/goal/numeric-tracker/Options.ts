import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    title?: string;
    unit?: string;
    precision?: string;
    width?: string;
    height?: string;
    yMin?: string;
    yMax?: string;
    goal?: string;
    visibleWindowDays?: string;
    ignoreSkippedDays?: string;
}
