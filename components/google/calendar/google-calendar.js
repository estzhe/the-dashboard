import Argument from '/lib/argument.js';
import Google from '/components/google/google.js';
import BaseComponent from '/components/base-component.js';
import { Temporal } from '@js-temporal/polyfill';

// TODO: we need to be more explicit about time zones:
//          - explicit display time zone (with validation that the time zone
//            is same as any other display timezoned datetime used (e.g., start
//            and end configured by user))
//          - use calendar/event time zone (right now it is ignored).

export default class GoogleCalendarComponent extends BaseComponent
{
    #title;
    #calendarsToDisplay;

    /**
     * Inclusive.
     * 
     * @type {Temporal.ZonedDateTime}
     */
    #startDateTime;
    
    /**
     * Inclusive.
     * 
     * @type {Temporal.ZonedDateTime}
     */
    #endDateTime;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);
        
        if (!options.calendars)
        {
            throw new Error("google-calendar: 'calendars' attribute is required.");
        }
        
        if (!options.start)
        {
            throw new Error("google-calendar: 'start' attribute is required.");
        }

        if (!options.end)
        {
            throw new Error("google-calendar: 'end' attribute is required.");
        }

        const startDateTime = GoogleCalendarComponent.#parseDateAttribute(options.start, /* rounding */ "down");;
        const endDateTime = GoogleCalendarComponent.#parseDateAttribute(options.end, /* rounding */ "up");

        if (Temporal.ZonedDateTime.compare(startDateTime, endDateTime) >= 0)
        {
            throw new Error("google-calendar: 'start' should be earlier than 'end'.");
        }

        this.#title = options.title;
        this.#calendarsToDisplay = GoogleCalendarComponent.#parseCalendarListAttribute(options.calendars);
        this.#startDateTime = startDateTime;
        this.#endDateTime = endDateTime;
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const calendarData = await this.#getEvents(refreshData);
        await this.#renderEvents(container, calendarData);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getEvents(/* refreshData */ true);
    }

    async #renderEvents(container, calendarData)
    {
        const { emailAddress, colors, eventsWithCalendars } = calendarData;

        const events = eventsWithCalendars.map(ec =>
            (ec.events ?? []).map(event =>
            {
                event.calendar = ec.calendar;
                event.color = colors.calendar[ec.calendar.colorId];

                event.isFullDay = !!event.start.date;
                if (event.isFullDay)
                {
                    event.start = Temporal.PlainDate.from(event.start.date).toZonedDateTimeISO(Temporal.Now.timeZone());
                    event.end = Temporal.PlainDate.from(event.end.date).toZonedDateTimeISO(Temporal.Now.timeZone());
                }
                else
                {
                    event.start = Temporal.Instant.from(event.start.dateTime).toZonedDateTimeISO(Temporal.Now.timeZone());
                    event.end = Temporal.Instant.from(event.end.dateTime).toZonedDateTimeISO(Temporal.Now.timeZone());
                }

                return event;
            }))
            .flat();

        const eventsByDate = [];
        for (
            let date = this.#startDateTime.toPlainDate();
            Temporal.PlainDate.compare(date, this.#endDateTime) <= 0;
            date = date.add({ days: 1 }))
        {
            const eventsOnThisDay = events
                .filter(e =>
                    Temporal.PlainDate.compare(e.start, date) <= 0 &&
                    Temporal.PlainDate.compare(date, e.end) <= 0)
                .sort((e1, e2) => Temporal.ZonedDateTime.compare(e1.start, e2.start))
                .map(e =>
                {
                    const startIsOnThisDay = date.equals(e.start);
                    const endIsOnThisDay = date.equals(e.end);
                    const isFullDay = e.isFullDay || !startIsOnThisDay && !endIsOnThisDay;

                    return {
                        title: e.summary,
                        uri: e.htmlLink,
                        notes: e.notes,

                        isFullDay,
                        showStartTime: !isFullDay && startIsOnThisDay,
                        showEndTime: !isFullDay && endIsOnThisDay,
                        startDateTime: e.start,
                        endDateTime: e.end,

                        calendar: {
                            name: e.calendar.summary,
                            color: e.color.background,
                        },
                    };
                });

            eventsByDate.push(
            {
                date,
                events: eventsOnThisDay,
            });
        }

        const data = {
            title: this.#title,
            emailAddress,
            eventsByDate,
        };
        
        container.innerHTML = await this._template("template", data);
    }

    async #getEvents(refreshData)
    {
        return await this._services.cache.get(
            "calendar-data",
            async () =>
            {
                const accessToken = await Google.getAccessToken(["https://www.googleapis.com/auth/calendar.readonly"]);
                const emailAddress = await Google.getEmailAddress();

                const calendars = await GoogleCalendarComponent.#fetchCalendars(this.#calendarsToDisplay, accessToken);
                const colors = await GoogleCalendarComponent.#fetchColors(accessToken);

                const eventsWithCalendars = await Promise.all(
                    calendars.map(async calendar =>
                    {
                        const events = await GoogleCalendarComponent.#fetchEvents(
                            calendar.id, this.#startDateTime, this.#endDateTime, accessToken);
                        
                        return { calendar, events };
                    }));
                
                return { emailAddress, colors, eventsWithCalendars };
            },
            refreshData);
    }

    /**
     * 
     * @param {string} calendarId
     * @param {Temporal.ZonedDateTime} startDateTime
     * @param {Temporal.ZonedDateTime} endDateTime
     * @param {string} accessToken
     * 
     * @returns {object}
     */
    static async #fetchEvents(calendarId, startDateTime, endDateTime, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(calendarId, "calendarId");
        Argument.notNullOrUndefined(startDateTime, "startDateTime");
        Argument.notNullOrUndefined(endDateTime, "endDateTime");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        if (startDateTime.timeZone.id !== endDateTime.timeZone.id)
        {
            throw new Error(
                `Timezones of startDateTime (${startDateTime.timeZone.id}) and `+
                `endDateTime (${endDateTime.timeZone.id}) are expected to match.`);
        }

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
                `?singleEvents=true` +
                `&timeMin=${startDateTime.toString({ timeZoneName: "never" })}` +
                `&timeMax=${endDateTime.toString({ timeZoneName: "never" })}` +
                `&timeZone=${encodeURIComponent(startDateTime.timeZone.id)}`,
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
                           calendar.summary.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0
                           ||
                           calendar.summaryOverride?.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0;
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

    /**
     * @param {string} value 
     * @param {"up"|"down"} rounding
     * 
     * @returns {Temporal.ZonedDateTime}
     */
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

        let dateTime = Temporal.Now.zonedDateTimeISO();

        if (offsetValue)
        {
            const offset = (offsetSign === "+" ? 1 : -1) * parseInt(offsetValue);
            dateTime = dateTime.add({ days: offset });
        }

        const needsRounding = anchor !== "now";
        if (needsRounding)
        {
            if (rounding === "down")
            {
                dateTime = dateTime.round({ smallestUnit: "day", roundingMode: "floor" });
            }
            else
            {
                dateTime = dateTime.round({ smallestUnit: "second", roundingMode: "floor" })
                                   .with({ hour: 23, minute: 59, second: 59 });
            }
        }

        return dateTime;
    }
}