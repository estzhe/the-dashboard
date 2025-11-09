import EventView from "app/components/google/calendar/EventView.js";

export default interface EventViewTailoredToSingleDayDisplay
{
    event: EventView;
    displayOptions: {
        showAsFullDay: boolean,
        showStartTime: boolean,
        showEndTime: boolean,
    }
}