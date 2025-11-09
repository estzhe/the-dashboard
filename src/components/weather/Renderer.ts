import Argument from 'app/lib/Argument.js';
import WeatherGraphics from 'app/components/weather/graphics/WeatherGraphics.js';
import { Temporal } from '@js-temporal/polyfill';
import Forecast from "app/components/weather/client/Forecast.js";
import PlainDate = Temporal.PlainDate;
import PlainDateTime = Temporal.PlainDateTime;
import HourlyForecastItem from "app/components/weather/HourlyForecastItem.js";
import ForecastStatistics from "app/components/weather/ForecastStatistics.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/weather/Engine.js";
import template from 'app/components/weather/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const forecasts = await this.engine.getForecasts(refreshData);

        // There is no way to filter by exact date and time, so we get extra records that need to be filtered out.
        const startDate: PlainDate = Temporal.Now.plainDateISO();
        const endDate: PlainDate = startDate;

        const forecast: HourlyForecastItem[] = this.toHourlyForecast(forecasts.hourly, startDate, endDate);
        const stats: ForecastStatistics = this.calculateStats(forecasts.daily);

        this.container.innerHTML = template(forecast);

        const temperatureCanvas = this.container.querySelector<HTMLCanvasElement>(".temperature")!;
        temperatureCanvas.width = window.innerWidth;
        WeatherGraphics.drawStrips(
            temperatureCanvas,
            forecast.map(h => h.temperature_2m),
            {
                start: { value: stats.minTemperature, color: "#000000" },
                end: { value: stats.maxTemperature, color: "#ffff00" },
            },
            /*randomnessFactor*/ 1,
        );

        const cloudsCanvas = this.container.querySelector<HTMLCanvasElement>(".clouds")!;
        cloudsCanvas.width = window.innerWidth;
        WeatherGraphics.drawStrips(
            cloudsCanvas,
            forecast.map(h => h.cloud_cover),
            {
                start: { value: 0, color: "rgb(94, 182, 255)" },
                end: { value: 100, color: "rgb(183, 185, 182)" },
            },
            /* randomnessFactor */ 1,
        );

        const rainAndSnowCanvas = this.container.querySelector<HTMLCanvasElement>(".rain-and-snow")!;
        rainAndSnowCanvas.width = window.innerWidth;
        WeatherGraphics.drawUpsideDownStackedBars(
            rainAndSnowCanvas,
            [
                {
                    values: forecast.map(h => h.snowfall),
                    color: "white",
                    scale: { min: 0, max: 1 },
                },
                {
                    values: forecast.map(h => h.rain + h.showers),
                    color: "#1878f0",
                    scale: { min: 0, max: 2 },
                },
            ]
        );
    }

    private toHourlyForecast(
        forecast: Forecast,
        startDate: PlainDate,
        endDate: PlainDate): HourlyForecastItem[]
    {
        Argument.notNullOrUndefined(forecast, "forecast");

        const currentHour: PlainDateTime = Temporal.Now
            .plainDateTimeISO()
            .round({ smallestUnit: "hour", roundingMode: "floor" });

        return forecast.hourly!.time
            .map((time: string, i: number): HourlyForecastItem | null => {
                // We request data in GMT, but Open-Meteo returns times without offset.
                const timeStringWithOffset = time + "+00:00";
                // Subtract an hour, because Open-Meteo returns data for preceeding hour,
                // while we want to display it for the following hour.
                const dateTime = Temporal.Instant.from(timeStringWithOffset)
                    .subtract({ hours: 1 })
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId());
                
                if (PlainDate.compare(dateTime, startDate) < 0 ||
                    PlainDate.compare(dateTime, endDate) > 0)
                {
                    return null;
                }

                const isCurrentHour = dateTime
                    .toPlainDateTime()
                    .round({ smallestUnit: "hour", roundingMode: "floor" })
                    .equals(currentHour);
                const displayTime = dateTime
                    .toLocaleString(undefined /* current locale */, { hour: "numeric", hourCycle: "h23" })
                    .replace(" ", "")
                    .toLowerCase();
                
                return {
                    dateTime,
                    displayTime,
                    isCurrentHour,
                    temperature_2m: forecast.hourly!.temperature_2m![i]!,
                    rain: forecast.hourly!.rain![i]!,
                    showers: forecast.hourly!.showers![i]!,
                    snowfall: forecast.hourly!.snowfall![i]!,
                    cloud_cover: forecast.hourly!.cloud_cover![i]!,
                };
            })
            .filter(e => e !== null);
    }

    private calculateStats(forecast: Forecast): ForecastStatistics
    {
        Argument.notNullOrUndefined(forecast, "forecast");
        Argument.notNullOrUndefined(forecast.daily, "forecast.daily");

        return {
            minTemperature: forecast.daily!.temperature_2m_min!.reduce((p, c) => Math.min(p, c)),
            maxTemperature: forecast.daily!.temperature_2m_max!.reduce((p, c) => Math.max(p, c)),
        };
    }
}
