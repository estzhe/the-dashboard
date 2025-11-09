import { Temporal } from "@js-temporal/polyfill";
import Argument from "app/lib/Argument.js";

export default class ReadableTemporalFormat
{
    /**
     * Formats a date into a human-readable string.
     */
    public static plainDateToString(date: Temporal.PlainDate): string
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        const today = Temporal.Now.plainDateISO().withCalendar(date.calendarId);
        const yesterday = today.subtract({ days: 1 });
        const tomorrow = today.add({ days: 1 });

        if (date.equals(yesterday))
        {
            return "yesterday";
        }

        if (date.equals(today))
        {
            return "today";
        }

        if (date.equals(tomorrow))
        {
            return "tomorrow";
        }

        const formatOptions: any = {
            day: "numeric",
            month: "numeric",
        };

        if (date.year !== today.year)
        {
            formatOptions.year = "numeric";
        }
        
        return date.toLocaleString(undefined /* current locale */, formatOptions);
    }

    /**
     * Formats date and time into a human-readable string.
     */
    static plainDateTimeToString(dateTime: Temporal.PlainDateTime): string
    {
        Argument.notNullOrUndefined(dateTime, "dateTime");
        Argument.isInstanceOf(dateTime, Temporal.PlainDateTime, "dateTime");

        const timeString = dateTime.toLocaleString(
            undefined /* current locale */,
            { hour: "numeric", hourCycle: "h23", minute: "numeric" });
        
        const dateString = ReadableTemporalFormat.plainDateToString(dateTime.toPlainDate());

        return `${timeString}, ${dateString}`;
    }
}