import { Temporal } from '@js-temporal/polyfill';
import ZonedDateTime = Temporal.ZonedDateTime;
import CalendarColors from "app/components/google/client/calendar/CalendarColors.js";
import CalendarWithEvents from "app/components/google/calendar/CalendarWithEvents.js";
import PlainDate = Temporal.PlainDate;
import EventView from "app/components/google/calendar/EventView.js";
import EventViewTailoredToSingleDayDisplay from "app/components/google/calendar/EventViewTailoredToSingleDayDisplay.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/google/calendar/Engine.js";
import template from 'app/components/google/calendar/template.hbs';

// TODO: we need to be more explicit about time zones:
//          - explicit display time zone (with validation that the time zone
//            is same as any other display timezoned datetime used (e.g., start
//            and end configured by user))
//          - use calendar/event time zone (right now it is ignored).

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean)
    {
        await super.render(refreshData);

        const userInfo = await this.engine.getUserInfo(refreshData);
        const { calendarsWithEvents, colors } = await this.engine.getCalendarData(refreshData);

        const eventViews = this.toEventViews(calendarsWithEvents, colors);
        const eventsByDate = this.groupEventsByDate(eventViews);

        const data = {
            title: this.engine.title,
            emailAddress: userInfo.email,
            eventsByDate,
        };
        this.container.innerHTML = template(data);
    }
    
    private groupEventsByDate(eventViews: EventView[])
        : { date: PlainDate, events: EventViewTailoredToSingleDayDisplay[] }[]
    {
        const eventsByDate: { date: PlainDate, events: EventViewTailoredToSingleDayDisplay[] }[] = [];
        for (
            let date: PlainDate = this.engine.startDateTime.toPlainDate();
            Temporal.PlainDate.compare(date, this.engine.endDateTime) <= 0;
            date = date.add({ days: 1 }))
        {
            const eventsOnThisDay = eventViews
                .filter(event =>
                    Temporal.PlainDate.compare(event.start, date) <= 0 &&
                    Temporal.PlainDate.compare(date, event.end) <= 0)
                .sort((e1, e2) => Temporal.ZonedDateTime.compare(e1.start, e2.start));
            
            const eventViewsTailoredToSingleDayDisplay =
                eventsOnThisDay.map(event => this.toEventViewTailoredToSingleDayDisplay(event, date));

            eventsByDate.push({
                date,
                events: eventViewsTailoredToSingleDayDisplay,
            });
        }
        
        return eventsByDate;
    }
    
    private toEventViewTailoredToSingleDayDisplay(
        eventView: EventView,
        date: PlainDate,
    ): EventViewTailoredToSingleDayDisplay
    {
        const startIsOnThisDay = date.equals(eventView.start);
        const endIsOnThisDay = date.equals(eventView.end);
        const showAsFullDay = eventView.isFullDay || !startIsOnThisDay && !endIsOnThisDay;

        return {
            event: eventView,
            displayOptions: {
                showAsFullDay,
                showStartTime: !showAsFullDay && startIsOnThisDay,
                showEndTime: !showAsFullDay && endIsOnThisDay,
            },
        };
    }
    
    private toEventViews(
        calendarsWithEvents: CalendarWithEvents[],
        colors: CalendarColors): EventView[]
    {
        return calendarsWithEvents
            .filter(calendarWithEvents => calendarWithEvents.events)
            .map(calendarWithEvents =>
                calendarWithEvents.events!.map(event =>
                {
                    const isFullDay = !!event.start.date;
                    let start: ZonedDateTime;
                    let end: ZonedDateTime;
                    if (isFullDay)
                    {
                        start = Temporal.PlainDate.from(event.start.date!)
                            .toZonedDateTime({
                                timeZone: Temporal.Now.timeZoneId(),
                                plainTime: Temporal.PlainTime.from("00:00:00"),
                            });
                        end = Temporal.PlainDate.from(event.end.date!)
                            .subtract({ days: 1 })
                            .toZonedDateTime({
                                timeZone: Temporal.Now.timeZoneId(),
                                plainTime: Temporal.PlainTime.from("23:59:59"),
                            });
                    }
                    else
                    {
                        start = Temporal.Instant.from(event.start.dateTime!)
                            .toZonedDateTimeISO(Temporal.Now.timeZoneId());
                        end = Temporal.Instant.from(event.end.dateTime!)
                            .toZonedDateTimeISO(Temporal.Now.timeZoneId());
                    }

                    let videoConferenceUri =
                        event.conferenceData
                            ?.entryPoints.find(p => p.entryPointType === "video")
                            ?.uri;
                    
                    return {
                        calendar: calendarWithEvents.calendar,
                        color: colors.calendar[calendarWithEvents.calendar.colorId]!,
                        isFullDay,
                        start,
                        end,
                        videoConferenceUri,
                        summary: event.summary,
                        htmlLink: event.htmlLink,
                        description: event.description,
                    };
                }))
            .flat();
    }
}