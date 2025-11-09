import Argument from "app/lib/Argument.js";
import Calendar from "app/components/google/client/calendar/Calendar.js";
import ListResponse from "app/components/google/client/ListResponse.js";
import {Temporal} from "@js-temporal/polyfill";
import CalendarEvent from "app/components/google/client/calendar/CalendarEvent.js";
import CalendarColors from "app/components/google/client/calendar/CalendarColors.js";
import MailListThreadsResponse from "app/components/google/client/mail/ListThreadsResponse.js";
import MailThread from "app/components/google/client/mail/Thread.js";
import UserInfo from "app/components/google/client/UserInfo.js";
import IAccessTokenProvider from "app/components/google/client/IAccessTokenProvider.js";

export default class GoogleClient
{
    private readonly accessTokenProvider: IAccessTokenProvider;
    
    constructor(accessTokenProvider: IAccessTokenProvider)
    {
        Argument.notNullOrUndefined(accessTokenProvider, "accessTokenProvider");
        this.accessTokenProvider = accessTokenProvider;
    }
    
    public async fetchEvents(
        calendarId: string,
        startDateTime: Temporal.ZonedDateTime,
        endDateTime: Temporal.ZonedDateTime): Promise<CalendarEvent[]|null>
    {
        Argument.notNullOrUndefinedOrEmpty(calendarId, "calendarId");
        Argument.notNullOrUndefined(startDateTime, "startDateTime");
        Argument.notNullOrUndefined(endDateTime, "endDateTime");

        if (startDateTime.timeZoneId !== endDateTime.timeZoneId)
        {
            throw new Error(
                `Timezones of startDateTime (${startDateTime.timeZoneId}) and `+
                `endDateTime (${endDateTime.timeZoneId}) are expected to match.`);
        }
        
        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/calendar.readonly"]);

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
                `?singleEvents=true` +
                `&timeMin=${startDateTime.toString({ timeZoneName: "never" })}` +
                `&timeMax=${endDateTime.toString({ timeZoneName: "never" })}` +
                `&timeZone=${encodeURIComponent(startDateTime.timeZoneId)}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        const payload = await response.json() as ListResponse<CalendarEvent>;

        return payload.items;
    }

    public async fetchCalendarColors(): Promise<CalendarColors>
    {
        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/calendar.readonly"]);
        
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/colors",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

        return await response.json() as CalendarColors;
    }

    public async fetchCalendars(calendarNames: string[]): Promise<Calendar[]>
    {
        Argument.notNullOrUndefined(calendarNames, "calendarNames");
        Argument.collectionNotEmpty(calendarNames, "calendarNames");

        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/calendar.readonly"]);
        
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

        const payload = await response.json() as ListResponse<Calendar>;

        return (payload.items ?? []).filter(
            calendar => calendarNames.some(
                calendarName =>
                {
                    return calendar.primary &&
                        calendarName.localeCompare("primary", undefined, { sensitivity: "accent" }) === 0
                        ||
                        calendar.summary.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0
                        ||
                        calendar.summaryOverride?.localeCompare(calendarName, undefined, { sensitivity: "accent" }) === 0;
                }));
    }

    public async archiveMailThread(threadId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(threadId, "threadId");

        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/gmail.modify"]);
        
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/ `,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    removeLabelIds: ["INBOX"],
                }),
            });
        
        await response.json();
    }
    
    public async fetchMailThreadsInInbox(): Promise<MailThread[]>
    {
        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/gmail.readonly"]);
        
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads` +
                `?includeSpamTrash=false` +
                `&labelIds=INBOX`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        const data = await response.json() as MailListThreadsResponse;
        return data.threads;
    }
    
    public async fetchMailThread(threadId: string): Promise<MailThread>
    {
        Argument.notNullOrUndefinedOrEmpty(threadId, "threadId");

        const accessToken = await this.accessTokenProvider.getAccessToken(
            ["https://www.googleapis.com/auth/gmail.readonly"]);
        
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}` +
                `?format=METADATA` +
                `&metadataHeaders=Subject` +
                `&metadataHeaders=From`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        
        return await response.json();
    }

    public async fetchUserInfo(): Promise<UserInfo>
    {
        const accessToken = await this.accessTokenProvider.getAccessToken(["email"]);
        
        const response = await fetch(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

        return await response.json() as UserInfo;
    }
}