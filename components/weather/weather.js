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

        for (const h of data.hourly)
        {
            const dateTime = Temporal.Instant.fromEpochSeconds(h.dt).toZonedDateTimeISO(Temporal.Now.timeZone());
            h.displayTime = dateTime.hour % 2 === 0
                ? dateTime
                    .toLocaleString(undefined /* current locale */, { hour: "numeric", hourCycle: "h12" })
                    .replace(" ", "")
                    .toLowerCase()
                : "";
        }

        container.innerHTML = await this._template("template", data);

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
            data.hourly.map(h => h.temp),
            {
                start: { value: 0, color: "#000000" },
                end: { value: 30, color: "#ffff00" },
            },
            /* randomnessFactor */ 1,
        );

        WeatherGraphics.drawStrips(
            elements.cloudsCanvas,
            data.hourly.map(h => h.clouds),
            {
                start: { value: 0, color: "rgb(183, 185, 182)" },
                end: { value: 100, color: "rgb(94, 182, 255)" },
            },
            /* randomnessFactor */ 1,
        );

        WeatherGraphics.drawUpsideDownStackedBars(
            elements.rainAndSnowCanvas,
            [
                {
                    values: data.hourly.map(h => h.snow?.["1h"] ?? 0),
                    color: "white",
                    scale: { min: 0, max: 1 },
                },
                {
                    values: data.hourly.map(h => h.rain?.["1h"] ?? 0),
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
                const apiKey = WeatherComponent.#getApiKey();
                const location = await WeatherComponent.#getLocation();
                return await WeatherComponent.#fetchWeatherData(location, apiKey);
            },
            refreshData);
    }

    static async #fetchWeatherData(location, apiKey)
    {
        Argument.notNullOrUndefined(location, "location");
        Argument.notNullOrUndefinedOrEmpty(apiKey, "apiKey");

        const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall` +
                                        `?lat=${location.latitude}` +
                                        `&lon=${location.longitude}` +
                                        `&appid=${apiKey}` +
                                        `&units=metric`);
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

    static #getApiKey()
    {
        const key = `openweathermap.apikey`;

        let apiKey = localStorage.getItem(key);
        if (!apiKey)
        {
            apiKey = prompt(`Please enter API key for OpenWeatherMap.`);
            if (!apiKey)
            {
                throw new Error("An OpenWeatherMap API key was not provided.");
            }

            localStorage.setItem(key, apiKey);
        }

        return apiKey;
    }
}
