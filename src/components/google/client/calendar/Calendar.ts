export default interface Calendar
{
    id: string;
    primary: boolean;
    summary: string;
    summaryOverride: string|undefined;
    colorId: string;
}