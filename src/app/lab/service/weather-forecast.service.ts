import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { GeocodingResponse, GeoLocation, WeatherData } from '../model/weather.models';

@Injectable({
  providedIn: 'root'
})
export class WeatherForecastService {
  private http = inject(HttpClient);
  private geoApiUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private weatherApiUrl = 'https://api.open-meteo.com/v1/forecast';

  searchCities(query: string): Observable<GeoLocation[]> {
    if (!query?.trim() || query.trim().length < 2) return of([]);

    const params = new HttpParams()
      .set('name', query.trim())
      .set('count', '5')
      .set('language', 'en')
      .set('format', 'json');

    return this.http.get<GeocodingResponse>(this.geoApiUrl, { params }).pipe(
      map(res => (res.results ?? []).map(item => ({
        ...item,
        displayName: [item.name, item.admin1, item.country].filter(Boolean).join(', ')
      })))
    );
  }

  getWeather(lat: number, lon: number, unit: 'C' | 'F' = 'C'): Observable<WeatherData> {
    const params = new HttpParams()
      .set('latitude', lat.toString())
      .set('longitude', lon.toString())
      .set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m')
      .set('hourly', 'temperature_2m,weather_code')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum')
      .set('temperature_unit', unit === 'F' ? 'fahrenheit' : 'celsius')
      .set('timezone', 'auto')
      .set('forecast_days', '7');

    return this.http.get<WeatherData>(this.weatherApiUrl, { params });
  }

  getWeatherCondition(code: number): { label: string; icon: string } {
    switch (code) {
      case 0:
        return { label: 'Clear Sky', icon: 'pi-sun' };
      case 1:
      case 2:
      case 3:
        return { label: 'Partly Cloudy', icon: 'pi-cloud' };
      case 45:
      case 48:
        return { label: 'Foggy', icon: 'pi-align-justify' };
      case 51:
      case 53:
      case 55:
        return { label: 'Drizzle', icon: 'pi-cloud-download' };
      case 61:
      case 63:
      case 65:
        return { label: 'Rain', icon: 'pi-cloud-download' };
      case 71:
      case 73:
      case 75:
        return { label: 'Snowfall', icon: 'pi-snowflake' };
      case 80:
      case 81:
      case 82:
        return { label: 'Showers', icon: 'pi-cloud-download' };
      case 95:
      case 96:
      case 99:
        return { label: 'Thunderstorm', icon: 'pi-bolt' };
      default:
        return { label: 'Overcast', icon: 'pi-cloud' };
    }
  }
}