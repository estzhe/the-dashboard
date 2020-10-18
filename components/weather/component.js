"use strict";

import { Argument } from '../../lib/argument.js';

export class WeatherComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

        this.container = container;
    }

    static get name() { return "weather"; }

    async render()
    {
        const apiKey = this.#getApiKey();
        const location = await this.#getLocation();
        const data = await this.#fetchWeatherData(location, apiKey);

        // TODO: components should not care about path structure here - provide mechanism to retrieve templates
        const templateText = await (await fetch("components/weather/component.hbs")).text();
        const template = Handlebars.compile(templateText);
        
        this.container.innerHTML = template(data);
    }

    async #fetchWeatherData(location, apiKey)
    {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall` +
                                        `?lat=${location.latitude}` +
                                        `&lon=${location.longitude}` +
                                        `&appid=${apiKey}` +
                                        `&units=metric`);
        return await response.json();
    }

    #getLocation()
    {
        return new Promise((resolve, reject) =>
        {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                () => reject("Count not get location."));
        });
    }

    #getApiKey()
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

/*

.current.temp
.current.sunrise
.current.sunset
.current.clouds
.current.rain?.1h
.current.snow?.1h
.current.weather[].description
.current.weather[].icon
.current.weather[].main

.daily[].dt
.daily[].temp.min
.daily[].temp.max
.daily[].temp.morn
.daily[].temp.day
.daily[].temp.night
.daily[].weather[].description
.daily[].weather[].icon
.daily[].weather[].main
.daily[].rain?
.daily[].snow?
.daily[].pop

.hourly[].dt
.hourly[].temp
.hourly[].weather[].description
.hourly[].weather[].icon
.hourly[].weather[].main
.hourly[].rain?.1h
.hourly[].snow?.1h
.hourly[].pop

.minutely[].dt
.minutely[].precipitation

https://openweathermap.org/api/one-call-api#data
https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2

*/