import Issue from "app/components/github/client/Issue.js";
import {Temporal} from "@js-temporal/polyfill";

export default interface IssueView extends Issue
{
    due?: {
        date: Temporal.PlainDate;
        is_past_due: boolean;
        is_due_today: boolean;
    }
}
