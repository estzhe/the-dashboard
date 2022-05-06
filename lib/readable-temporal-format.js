import { Temporal } from "@js-temporal/polyfill";
import Argument from "/lib/argument.js";

export default class ReadableTemporalFormat
{
    /**
     * Formats a date into a human-readable string.
     * 
     * @param {Temporal.PlainDate} date
     * 
     * @returns {string}
     */
    static plainDateToString(date)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        const today = Temporal.Now.plainDate(date.calendar);
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

        const formatOptions = {
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
     * 
     * @param {Temporal.PlainDateTime} dateTime
     * 
     * @returns {string}
     */
    static plainDateTimeToString(dateTime)
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