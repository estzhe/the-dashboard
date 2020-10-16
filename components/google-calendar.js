"use strict";

import { Argument } from '../lib/argument.js';

export class GoogleCalendarComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

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

        this.container = container;
        this.calendarsToDisplay = GoogleCalendarComponent.#parseCalendarListAttribute(calendars);
        this.start = GoogleCalendarComponent.#parseDateAttribute(start, /* rounding */ "down");
        this.end = GoogleCalendarComponent.#parseDateAttribute(end, /* rounding */ "up");
        this.title = container.getAttribute("title");
    }

    static get name() { return "google-calendar"; }

    async render()
    {
        const calendars = await this.#fetchCalendars(this.calendarsToDisplay);
        const colors = await this.#fetchColors();

        const arraysOfEventInfos = await Promise.all(
            calendars.map(async calendar =>
            {
                const events = await this.#fetchEvents(calendar.id, this.start, this.end);
                return events.map(event => ({
                                                event,
                                                calendar,
                                                color: colors.calendar[calendar.colorId],
                                            }));
            }));
        
        const eventInfos = arraysOfEventInfos.flat().sort(
            (e1, e2) => e1.event.start.dateTime.localeCompare(e2.event.start.dateTime));

        let html = this.title ? `<h1>${this.title}</h1>` : "";
        html +=
            eventInfos.map(e => `
                <div style='background-color: ${e.color.background}'>
                    ${e.event.start.dateTime} - ${e.event.end.dateTime}:
                    <a href="${e.event.htmlLink}">
                        ${escapeHtml(e.event.summary)}
                    </a>
                    | ${escapeHtml(e.calendar.summary)}
                </div>`
            ).join("\n");

        this.container.innerHTML = html;
    }

    #fetchEvents(calendarId, start, end)
    {
        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true }, accessToken =>
            {
                fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events` +
                        `?singleEvents=true` +
                        `&timeMin=${start.toISOString()}` +
                        `&timeMax=${end.toISOString()}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        }
                    })
                .then(response => response.json())
                .then(response =>
                {
                    resolve(response.items);
                });
            });
        });
    }

    #fetchColors()
    {
        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true }, accessToken =>
            {
                fetch("https://www.googleapis.com/calendar/v3/colors", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                })
                .then(response => response.json())
                .then(response =>
                {
                    resolve(response);
                });
            });
        });
    }

    #fetchCalendars(calendarsToDisplay)
    {
        Argument.notNullOrUndefined(calendarsToDisplay, "calendarsToDisplay");
        Argument.collectionNotEmpty(calendarsToDisplay, "calendarsToDisplay");

        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true }, accessToken =>
            {
                fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                })
                .then(response => response.json())
                .then(response =>
                {
                    const calendars = response.items.filter(
                        calendar => calendarsToDisplay.some(
                            calendarName =>
                            {
                                return calendar.primary &&
                                       calendarName.localeCompare("primary", undefined, { sensitivity: "accent" }) === 0
                                       ||
                                       calendar.summary.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0;
                            }));

                    resolve(calendars);
                });
            });
        });
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

// TODO: move to common
function escapeHtml(html)
{
    Argument.notNullOrUndefined(html, "html");

    return html.replace(/&/g, "&amp;")
                .replace(/>/g, "&gt;")
                .replace(/</g, "&lt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
}