export default interface Forecast
{
    latitude: number,
    longitude: number,
    generationtime_ms: number,
    utc_offset_seconds: number,
    timezone: string,
    timezone_abbreviation: string,
    elevation: number,
    
    daily_units?: {
        time: string,
        temperature_2m_max?: string,
        temperature_2m_min?: string,
    },
    daily?: {
        time: string[],
        temperature_2m_max?: number[],
        temperature_2m_min?: number[],
    },
    
    hourly_units?: {
        time: string,
        temperature_2m?: string,
        rain?: string,
        showers?: string,
        snowfall?: string,
        cloud_cover?: string,
    },
    hourly?: {
        time: string[],
        temperature_2m?: number[],
        rain?: number[],
        showers?: number[],
        snowfall?: number[],
        cloud_cover?: number[],
    },
}