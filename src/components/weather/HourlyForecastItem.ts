import {Temporal} from "@js-temporal/polyfill";

export default interface HourlyForecastItem
{
    dateTime: Temporal.ZonedDateTime,
    displayTime: string,
    isCurrentHour: boolean,
    temperature_2m: number,
    rain: number,
    showers: number,
    snowfall: number,
    cloud_cover: number,
}