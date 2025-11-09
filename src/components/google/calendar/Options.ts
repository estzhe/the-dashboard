import BaseComponentOptions from "app/components/BaseComponentOptions.js";

export default interface Options extends BaseComponentOptions
{
    calendars: string|undefined;
    start: string|undefined;
    end: string|undefined;
    title: string|undefined;
}
