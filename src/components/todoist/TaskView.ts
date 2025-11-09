import {Temporal} from "@js-temporal/polyfill";

export default interface TaskView
{
    id: string;
    description: string;
    content: string;
    due?: {
        date: Temporal.PlainDate;
        is_past_due: boolean;
        is_due_today: boolean;
    },
    day_order?: number;
    child_order: number;
}