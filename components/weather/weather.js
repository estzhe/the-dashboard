import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import WeatherGraphics from '/components/weather/weather-graphics.js';

export default class WeatherComponent extends BaseComponent
{
    constructor(root, container)
    {
        super(root, container);
    }

    static get name() { return "weather"; }

    async render()
    {
        const apiKey = WeatherComponent.#getApiKey();
        const location = await WeatherComponent.#getLocation();
        const data = await WeatherComponent.#fetchWeatherData(location, apiKey);

        for (const h of data.hourly)
        {
            const date = new Date(h.dt * 1000);
            console.log(date);
            h.displayTime = date.getHours() % 2 == 0
                ? (date.getHours() % 12 || 12) + "" + (date.getHours() < 12 ? "am" : "pm")
                : "";
        }

        this._container.innerHTML = await this._template("template", data);

        const elements = {
            temperatureCanvas: this._container.querySelector(".temperature"),
            cloudsCanvas: this._container.querySelector(".clouds"),
            rainAndSnowCanvas: this._container.querySelector(".rain-and-snow"),
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
