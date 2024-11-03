import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import WeatherGraphics from '/components/weather/weather-graphics.js';
import { Temporal } from '@js-temporal/polyfill';

export default class WeatherComponent extends BaseComponent
{
    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const data = await this.#getData(refreshData);
        await this.#renderData(container, data);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getData(/* refreshData */ true);
    }

    async #renderData(container, data)
    {
        Argument.notNullOrUndefined(container, "container");
        Argument.notNullOrUndefined(data, "data");

        container.innerHTML = await this._template("template", data.forecast);

        const elements = {
            temperatureCanvas: container.querySelector(".temperature"),
            cloudsCanvas: container.querySelector(".clouds"),
            rainAndSnowCanvas: container.querySelector(".rain-and-snow"),
        };

        elements.temperatureCanvas.width = window.innerWidth;
        elements.cloudsCanvas.width = window.innerWidth;
        elements.rainAndSnowCanvas.width = window.innerWidth;

        WeatherGraphics.drawStrips(
            elements.temperatureCanvas,
            data.forecast.map(h => h.temperature_2m),
            {
                start: { value: data.stats.minTemperature, color: "#000000" },
                end: { value: data.stats.maxTemperature, color: "#ffff00" },
            },
            /* randomnessFactor */ 1,
        );

        WeatherGraphics.drawStrips(
            elements.cloudsCanvas,
            data.forecast.map(h => h.cloud_cover),
            {
                start: { value: 0, color: "rgb(94, 182, 255)" },
                end: { value: 100, color: "rgb(183, 185, 182)" },
            },
            /* randomnessFactor */ 1,
        );

        WeatherGraphics.drawUpsideDownStackedBars(
            elements.rainAndSnowCanvas,
            [
                {
                    values: data.forecast.map(h => h.snowfall),
                    color: "white",
                    scale: { min: 0, max: 1 },
                },
                {
                    values: data.forecast.map(h => h.rain + h.showers),
                    color: "#1878f0",
                    scale: { min: 0, max: 2 },
                },
            ]
        );
    }

    async #getData(refreshData)
    {
        return await this._services.cache.instance.get(
            "data",
            async () =>
            {
                const location = await WeatherComponent.#getLocation();

                const results = await Promise.all([
                    WeatherComponent.#fetchForecast(location),
                    WeatherComponent.#fetchTemperatureStats(location),
                ]);

                const forecast = WeatherComponent.#distillForecast(results[0]);
                const stats = WeatherComponent.#distillStats(results[1]);
                
                return {
                    forecast,
                    stats,
                };
            },
            refreshData);
    }

    static #distillForecast(forecastData)
    {
        Argument.notNullOrUndefined(forecastData, "forecastData");

        // There is no way to filter by exact date and time, so we get extra records
        // that need to be filtered out.
        const startDate = Temporal.Now.plainDateISO();
        const endDate = startDate.add({ days: 2 }); // today + tomorrow + the day after tomorrow

        return forecastData.hourly.time
            .map((time, i) => {
                // We request data in GMT, but Open-Meteo returns times without offset.
                const timeStringWithOffset = time + "+00:00";
                // Subtract an hour, because Open-Meteo returns data for preceeding hour,
                // while we want to display it for the following hour.
                const dateTime = Temporal.Instant.from(timeStringWithOffset)
                    .subtract({ hours: 1 })
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId());
                
                if (Temporal.PlainDate.compare(dateTime, startDate) < 0 ||
                    Temporal.PlainDate.compare(dateTime, endDate) > 0)
                {
                    return null;
                }

                const displayTime = dateTime.hour % 2 === 0
                    ? dateTime
                        .toLocaleString(undefined /* current locale */, { hour: "numeric", hourCycle: "h23" })
                        .replace(" ", "")
                        .toLowerCase()
                    : "";

                return {
                    dateTime,
                    displayTime,
                    temperature_2m: forecastData.hourly.temperature_2m[i],
                    rain: forecastData.hourly.rain[i],
                    showers: forecastData.hourly.showers[i],
                    snowfall: forecastData.hourly.snowfall[i],
                    cloud_cover: forecastData.hourly.cloud_cover[i],
                };
            })
            .filter(e => e !== null);
    }

    static #distillStats(statsData)
    {
        Argument.notNullOrUndefined(statsData, "statsData");

        return {
            minTemperature: statsData.daily.temperature_2m_min.reduce((p, c) => Math.min(p, c)),
            maxTemperature: statsData.daily.temperature_2m_max.reduce((p, c) => Math.max(p, c)),
        };
    }

    static async #fetchForecast(location)
    {
        Argument.notNullOrUndefined(location, "location");

        const response = await fetch(`https://api.open-meteo.com/v1/forecast` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&hourly=temperature_2m,rain,showers,snowfall,cloud_cover` +
            `&forecast_days=4`);

        return await response.json();
    }

    static async #fetchTemperatureStats(location)
    {
        Argument.notNullOrUndefined(location, "location");

        const response = await fetch(`https://api.open-meteo.com/v1/forecast` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min` +
            `&past_days=14` +
            `&forecast_days=4`);

        return await response.json();
    }

    static #getLocation()
    {
        return new Promise((resolve, reject) =>
        {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                () => reject("Count not get location."));
        });
    }
}
