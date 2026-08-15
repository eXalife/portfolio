export interface GeoLocation {
    id?: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    displayName?: string;
}

export interface GeocodingResponse {
    results?: GeoLocation[];
}

export interface WeatherCondition {
    label: string;
    icon: string;
}

export interface HourlyForecastItem {
    time: string;
    temperature: number;
    weatherCode: number;
    condition: WeatherCondition;
}

export interface DailyForecastItem {
    date: string;
    weatherCode: number;
    maxTemp: number;
    minTemp: number;
    condition: WeatherCondition;
}

export interface WeatherData {
    current: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        precipitation: number;
        weather_code: number;
        wind_speed_10m: number;
    };
    current_units: {
        temperature_2m: string;
        relative_humidity_2m: string;
        apparent_temperature: string;
        precipitation: string;
        wind_speed_10m: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
    };
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
    };
}