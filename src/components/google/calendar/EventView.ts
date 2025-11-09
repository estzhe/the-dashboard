import Calendar from "app/components/google/client/calendar/Calendar.js";
import {Temporal} from "@js-temporal/polyfill";

export default interface EventView
{
    calendar: Calendar;
    color: {
        foreground: string,
        background: string,
    },
    isFullDay: boolean,
    start: Temporal.ZonedDateTime,
    end: Temporal.ZonedDateTime,
    videoConferenceUri?: string,
    summary: string,
    htmlLink: string,
    description?: string,
}