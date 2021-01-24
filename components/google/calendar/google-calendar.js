import Argument from '/lib/argument.js';
import Google from '/components/google/google.js';
import BaseComponent from '/components/base-component.js';
import "/lib/date.js";

export default class GoogleCalendarComponent extends BaseComponent
{
    #title;
    #calendarsToDisplay;
    #start;
    #end;

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

        const start = GoogleCalendarComponent.#parseDateAttribute(options.start, /* rounding */ "down");;
        const end = GoogleCalendarComponent.#parseDateAttribute(options.end, /* rounding */ "up");

        if (start >= end)
        {
            throw new Error("google-calendar: 'start' should be earlier than 'end'.");
        }

        this.#title = options.title;
        this.#calendarsToDisplay = GoogleCalendarComponent.#parseCalendarListAttribute(options.calendars);
        this.#start = start;
        this.#end = end;
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
                    let parts = event.start.date.split(/\D/);
                    parts[1]--; // month
                    event.start = new Date(...parts);

                    parts = event.end.date.split(/\D/);
                    parts[1]--; // month
                    event.end = new Date(...parts);
                }
                else
                {
                    event.start = new Date(Date.parse(event.start.dateTime));
                    event.end = new Date(Date.parse(event.end.dateTime));
                }

                return event;
            }))
            .flat();

        const eventsByDate = [];
        for (let date = this.#start.startOfDay(); date < this.#end; date = date.addDays(1))
        {
            const eventsOnThisDay = events
                .filter(e => e.start < date.addDays(1) && date < e.end)
                .sort((e1, e2) => e1.start.getTime() - e2.start.getTime())
                .map(e =>
                {
                    const startIsOnThisDay = !(e.start < date);
                    const endIsOnThisDay = !(e.end > date.endOfDay());
                    const isFullDay = e.isFullDay || !startIsOnThisDay && !endIsOnThisDay;

                    return {
                        title: e.summary,
                        uri: e.htmlLink,
                        notes: e.notes,

                        isFullDay,
                        showStartTime: !isFullDay && startIsOnThisDay,
                        showEndTime: !isFullDay && endIsOnThisDay,
                        startTime: e.start,
                        endTime: e.end,

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
                            calendar.id, this.#start, this.#end, accessToken);
                        
                        return { calendar, events };
                    }));
                
                return { emailAddress, colors, eventsWithCalendars };
            },
            refreshData);
    }

    static async #fetchEvents(calendarId, start, end, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(calendarId, "calendarId");
        Argument.notNullOrUndefined(start, "start");
        Argument.notNullOrUndefined(end, "end");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
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