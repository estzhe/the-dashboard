import Argument from "app/lib/Argument.js";
import Forecast from "app/components/weather/client/Forecast.js";

export default class OpenMeteoClient
{
    public async fetchHourlyForecast(
        coordinates: GeolocationCoordinates,
        pastDays: number,
        forecastDays: number): Promise<Forecast>
    {
        Argument.notNullOrUndefined(coordinates, "location");
        Argument.isNumber(pastDays, "pastDays");
        Argument.min(pastDays, 0, "pastDays");
        Argument.isNumber(forecastDays, "forecastDays");
        Argument.min(forecastDays, 0, "forecastDays");

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${coordinates.latitude}` +
                `&longitude=${coordinates.longitude}` +
                `&hourly=temperature_2m,rain,showers,snowfall,cloud_cover` +
                `&past_days=${pastDays}` +
                `&forecast_days=${forecastDays}`);

        return await response.json() as Forecast;
    }

    public async fetchDailyTemperatureForecast(
        coordinates: GeolocationCoordinates,
        pastDays: number,
        forecastDays: number): Promise<Forecast>
    {
        Argument.notNullOrUndefined(coordinates, "coordinates");
        Argument.isNumber(pastDays, "pastDays");
        Argument.min(pastDays, 0, "pastDays");
        Argument.isNumber(forecastDays, "forecastDays");
        Argument.min(forecastDays, 0, "forecastDays");

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${coordinates.latitude}` +
                `&longitude=${coordinates.longitude}` +
                `&daily=temperature_2m_max,temperature_2m_min` +
                `&past_days=${pastDays}` +
                `&forecast_days=${forecastDays}`);

        return await response.json() as Forecast;
    }
}