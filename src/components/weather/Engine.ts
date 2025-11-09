import OpenMeteoClient from "app/components/weather/client/OpenMeteoClient.js";
import Forecast from "app/components/weather/client/Forecast.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getForecasts(/*refreshData*/ true);
    }

    public async getForecasts(refreshData: boolean): Promise<{ hourly: Forecast, daily: Forecast }>
    {
        return await this.services.cache.instance.get(
            "data",
            async () =>
            {
                const client = new OpenMeteoClient();
                
                const coordinates: GeolocationCoordinates = await Engine.getLocation();

                const results = await Promise.all([
                    client.fetchHourlyForecast(coordinates, 1, 2),
                    client.fetchDailyTemperatureForecast(coordinates, 14, 4),
                ]);
                
                return {
                    hourly: results[0],
                    daily: results[1],
                };
            },
            refreshData);
    }

    private static getLocation(): Promise<GeolocationCoordinates>
    {
        return new Promise((resolve, reject) =>
        {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                () => reject("Count not get location."));
        });
    }
}
