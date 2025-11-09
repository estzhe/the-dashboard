/**
 * @see https://developers.google.com/workspace/calendar/api/v3/reference/events#resource
 */
export default interface CalendarEvent
{
    summary: string,
    htmlLink: string,
    description?: string,
    start: {
        date?: string,
        dateTime?: string,
        timeZone?: string,
    },
    end: {
        date?: string,
        dateTime?: string,
        timeZone?: string,
    },
    conferenceData?: {
        entryPoints: {
            entryPointType: string,
            uri: string,
        }[]
    }
}