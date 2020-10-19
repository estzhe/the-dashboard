import Argument from '/lib/argument.js';
import Google from '/components/google/google.js';
import BaseComponent from '/components/base-component.js';

export default class GoogleCalendarComponent extends BaseComponent
{
    #title;
    #calendarsToDisplay;
    #start;
    #end;

    constructor(root, container)
    {
        super(root, container);
        
        const calendars = container.getAttribute("calendars");
        if (!calendars)
        {
            throw new Error("google-calendar: 'calendars' attribute is required.");
        }
        
        const start = container.getAttribute("start");
        if (!start)
        {
            throw new Error("google-calendar: 'start' attribute is required.");
        }

        const end = container.getAttribute("end");
        if (!end)
        {
            throw new Error("google-calendar: 'end' attribute is required.");
        }

        if (start >= end)
        {
            throw new Error("google-calendar: 'start' should be earlier than 'end'.");
        }

        this.#title = container.getAttribute("title");
        this.#calendarsToDisplay = GoogleCalendarComponent.#parseCalendarListAttribute(calendars);
        this.#start = GoogleCalendarComponent.#parseDateAttribute(start, /* rounding */ "down");
        this.#end = GoogleCalendarComponent.#parseDateAttribute(end, /* rounding */ "up");
    }

    static get name() { return "google-calendar"; }

    async render()
    {
        const accessToken = await Google.getAccessToken(["https://www.googleapis.com/auth/calendar.readonly"]);

        const calendars = await GoogleCalendarComponent.#fetchCalendars(this.#calendarsToDisplay, accessToken);
        const colors = await GoogleCalendarComponent.#fetchColors(accessToken);

        const arraysOfEventInfos = await Promise.all(
            calendars.map(async calendar =>
            {
                const events = await GoogleCalendarComponent.#fetchEvents(
                    calendar.id, this.#start, this.#end, accessToken);
                
                return events.map(event => ({
                                                event,
                                                calendar,
                                                color: colors.calendar[calendar.colorId],
                                            }));
            }));
        
        const eventInfos = arraysOfEventInfos.flat().sort(
            (e1, e2) => e1.event.start.dateTime.localeCompare(e2.event.start.dateTime));

        const data = {
            title: this.#title,
            eventInfos,
        };
        
        this._container.innerHTML = await this._template("template", data);
    }

    static async #fetchEvents(calendarId, start, end, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(calendarId, "calendarId");
        Argument.notNullOrUndefined(start, "start");
        Argument.notNullOrUndefined(end, "end");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events` +
                `?singleEvents=true` +
                `&timeMin=${start.toISOString()}` +
                `&timeMax=${end.toISOString()}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        
        const json = await response.json();

        return json.items;
    }

    static async #fetchColors(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/colors",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
        });

        return await response.json();
    }

    static async #fetchCalendars(calendarsToDisplay, accessToken)
    {
        Argument.notNullOrUndefined(calendarsToDisplay, "calendarsToDisplay");
        Argument.collectionNotEmpty(calendarsToDisplay, "calendarsToDisplay");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

        const json = await response.json();

        const calendars = json.items.filter(
            calendar => calendarsToDisplay.some(
                calendarName =>
                {
                    return calendar.primary &&
                           calendarName.localeCompare("primary", undefined, { sensitivity: "accent" }) === 0
                           ||
                           calendar.summary.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0;
                }));

        return calendars;
    }

    static #parseCalendarListAttribute(value)
    {
        Argument.notNullOrUndefinedOrEmpty(value, "value");

        const calendarNames = value.split(/\s*,\s*/).filter(part => part);
        if (calendarNames.length === 0)
        {
            throw new Error("There are no calendars specified.");
        }

        return calendarNames;
    }

    static #parseDateAttribute(value, rounding)
    {
        Argument.notNullOrUndefinedOrEmpty(value, "value");
        Argument.notNullOrUndefinedOrEmpty(rounding, "rounding");
        Argument.oneOf(rounding, ["up", "down"], "rounding");

        const regex = /^\s*(?<anchor>now|today)\s*(?:(?<offsetSign>\+|-)\s*(?<offsetValue>\d+))?\s*$/i;
        const match = value.match(regex);
        if (!match)
        {
            throw new Error("Date must be one of 'now', 'today', 'now +/- N', 'today +/- N'.");
        }

        const { anchor, offsetSign, offsetValue } = match.groups;

        const date = new Date();

        if (offsetValue)
        {
            const offset = (offsetSign === "+" ? 1 : -1) * parseInt(offsetValue);
            date.setDate(date.getDate() + offset);
        }

        const needsRounding = anchor !== "now";
        if (needsRounding)
        {
            if (rounding === "down")
            {
                date.setHours(0, 0, 0, 0);
            }
            else
            {
                date.setHours(23, 59, 59, 999);
            }
        }

        return date;
    }
}