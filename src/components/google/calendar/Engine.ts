import Argument from 'app/lib/Argument.js';
import { Temporal } from '@js-temporal/polyfill';
import DashboardServices from "app/dashboard/DashboardServices.js";
import Options from "app/components/google/calendar/Options.js";
import ZonedDateTime = Temporal.ZonedDateTime;
import GoogleClient from "app/components/google/client/GoogleClient.js";
import CalendarColors from "app/components/google/client/calendar/CalendarColors.js";
import CalendarWithEvents from "app/components/google/calendar/CalendarWithEvents.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";
import ChromeAccessTokenProvider from "app/components/google/ChromeAccessTokenProvider.js";
import UserInfo from "app/components/google/client/UserInfo.js";

// TODO: we need to be more explicit about time zones:
//          - explicit display time zone (with validation that the time zone
//            is same as any other display timezoned datetime used (e.g., start
//            and end configured by user))
//          - use calendar/event time zone (right now it is ignored).

export default class Engine extends BaseComponentEngine
{
    public readonly title: string|undefined;
    public readonly calendarsToDisplay: string[];

    /**
     * Inclusive.
     */
    public readonly startDateTime: Temporal.ZonedDateTime;
    
    /**
     * Inclusive.
     */
    public readonly endDateTime: Temporal.ZonedDateTime;

    private readonly client: GoogleClient;

    constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);
        
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

        const startDateTime: ZonedDateTime = this.parseDateAttribute(options.start, /* rounding */ "down");
        const endDateTime: ZonedDateTime = this.parseDateAttribute(options.end, /* rounding */ "up");

        if (Temporal.ZonedDateTime.compare(startDateTime, endDateTime) >= 0)
        {
            throw new Error("google-calendar: 'start' should be earlier than 'end'.");
        }

        this.title = options.title;
        this.calendarsToDisplay = this.parseCalendarListAttribute(options.calendars);
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;

        this.client = new GoogleClient(new ChromeAccessTokenProvider());
    }

    public override async refreshData()
    {
        await super.refreshData();
        
        await this.getUserInfo(/*refreshData*/ true);
        await this.getCalendarData(/*refreshData*/ true);
    }

    public async getUserInfo(refreshData: boolean): Promise<UserInfo>
    {
        return await this.services.cache.instance.get(
            "userinfo",
            async () => await this.client.fetchUserInfo(),
            refreshData);
    }

    public async getCalendarData(refreshData: boolean)
        : Promise<{calendarsWithEvents: CalendarWithEvents[], colors: CalendarColors}>
    {
        return await this.services.cache.instance.get(
            "calendar-data",
            async () =>
            {
                const calendars = await this.client.fetchCalendars(this.calendarsToDisplay);
                const calendarsWithEvents = await Promise.all(
                    calendars.map(async calendar =>
                    {
                        const events = await this.client.fetchEvents(
                            calendar.id, this.startDateTime, this.endDateTime);
                        
                        return { calendar, events };
                    }));

                const colors = await this.client.fetchCalendarColors();
                
                return { colors, calendarsWithEvents };
            },
            refreshData);
    }

    /**
     * @param value - list of calendar names.
     */
    private parseCalendarListAttribute(value: string): string[]
    {
        Argument.notNullOrUndefinedOrEmpty(value, "value");

        const calendarNames: string[] = value.split(/\s*,\s*/).filter(part => part);
        if (calendarNames.length === 0)
        {
            throw new Error("There are no calendars specified.");
        }

        return calendarNames;
    }

    /**
     * @param value - now | today | now +/- N | today +/- N 
     * @param rounding - up | down
     */
    private parseDateAttribute(value: string, rounding: "up"|"down"): Temporal.ZonedDateTime
    {
        Argument.notNullOrUndefinedOrEmpty(value, "value");
        Argument.notNullOrUndefinedOrEmpty(rounding, "rounding");
        Argument.oneOf(rounding, ["up", "down"], "rounding");

        const regex = /^\s*(?<anchor>now|today)\s*(?:(?<offsetSign>[+-])\s*(?<offsetValue>\d+))?\s*$/i;
        const match = value.match(regex);
        if (!match)
        {
            throw new Error("Date must be one of 'now', 'today', 'now +/- N', 'today +/- N'.");
        }

        const anchor = match.groups!.anchor!;
        const offsetSign = match.groups!.offsetSign!;
        const offsetValue = match.groups!.offsetValue!;

        let dateTime: Temporal.ZonedDateTime = Temporal.Now.zonedDateTimeISO();

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