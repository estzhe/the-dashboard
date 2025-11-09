import Calendar from "app/components/google/client/calendar/Calendar.js";
import CalendarEvent from "app/components/google/client/calendar/CalendarEvent.js";

export default interface CalendarWithEvents
{
    calendar: Calendar,
    events: CalendarEvent[]|null,
}