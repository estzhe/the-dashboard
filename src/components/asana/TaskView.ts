import Task from "app/components/asana/client/Task.js";
import {Temporal} from "@js-temporal/polyfill";

export default interface TaskView extends Task
{
    isRecentlyAssigned: boolean,
    due?: {
        date: Temporal.PlainDate;
        is_past_due: boolean;
        is_due_today: boolean;
    },
}