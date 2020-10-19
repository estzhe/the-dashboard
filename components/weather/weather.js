import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';

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

        this._container.innerHTML = await this._template("template", data);
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
