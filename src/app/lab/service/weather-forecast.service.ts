import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { GeoLocation, GeocodingResponse, WeatherData } from '../model/weather.models';

@Injectable({
  providedIn: 'root'
})
export class WeatherForecastService {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  private readonly fallbackLocation: GeoLocation = {
    latitude: -78.558876,
    longitude: 106.70658,
    name: 'Vostok Station',
    admin1: 'Antarctica',
    country: 'Antarctica',
    displayName: 'Vostok Station, Antarctica'
  };

  getClientLocation(): Observable<GeoLocation | null> {
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      switchMap(res => {
        if (res.error || !res.latitude || !res.longitude) return of(null);

        const fallbackLocation: GeoLocation = {
          latitude: res.latitude,
          longitude: res.longitude,
          name: res.city,
          admin1: res.region,
          country: res.country_name,
          displayName: [res.city, res.region, res.country_name].filter(Boolean).join(', ')
        };

        if (!res.city) return of(fallbackLocation);

        return this.searchCities(res.city).pipe(
          map(results => {
            if (results && results.length > 0) {
              return results.reduce((prev, curr) => {
                const prevDist = Math.abs(prev.latitude - res.latitude) + Math.abs(prev.longitude - res.longitude);
                const currDist = Math.abs(curr.latitude - res.latitude) + Math.abs(curr.longitude - res.longitude);

                return currDist < prevDist ? curr : prev;
              });
            }
            return fallbackLocation;
          }),
          catchError(() => of(fallbackLocation))
        );
      }),
      catchError(() => {
        this.messageService.add({
          severity: 'info', summary: 'Location Unavailable', detail: "IP location couldn't be located. Defaulting to Vostok Station, Antarctica.", life: 10000
        });
        return of(this.fallbackLocation);
      })
    );
  }

  searchCities(query: string): Observable<GeoLocation[]> {
    if (!query?.trim() || query.trim().length < 2) return of([]);

    const params = new HttpParams()
      .set('name', query.trim())

    return this.http.get<GeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', { params }).pipe(
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
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
      .set('temperature_unit', unit === 'F' ? 'fahrenheit' : 'celsius')
      .set('timezone', 'auto')
      .set('forecast_days', '7')
      .set('forecast_hours', '48');

    return this.http.get<WeatherData>('https://api.open-meteo.com/v1/forecast', { params });
  }

  // https://open-meteo.com/en/docs#weather_variable_documentation
  getWeatherCondition(code: number): { label: string; icon: string } {
    switch (code) {
      case 0:
        return { label: 'Clear Sky', icon: 'pi-sun' };

      case 1:
        return { label: 'Mainly Clear', icon: 'pi-sun' };
      case 2:
        return { label: 'Partly Cloudy', icon: 'pi-cloud' };
      case 3:
        return { label: 'Overcast', icon: 'pi-cloud' };

      case 45:
        return { label: 'Fog', icon: 'pi-align-justify' };
      case 48:
        return { label: 'Depositing Rime Fog', icon: 'pi-align-justify' };

      case 51:
        return { label: 'Light Drizzle', icon: 'pi-cloud-download' };
      case 53:
        return { label: 'Moderate Drizzle', icon: 'pi-cloud-download' };
      case 55:
        return { label: 'Dense Drizzle', icon: 'pi-cloud-download' };

      case 56:
        return { label: 'Light Freezing Drizzle', icon: 'pi-snowflake' };
      case 57:
        return { label: 'Dense Freezing Drizzle', icon: 'pi-snowflake' };

      case 61:
        return { label: 'Slight Rain', icon: 'pi-cloud-download' };
      case 63:
        return { label: 'Moderate Rain', icon: 'pi-cloud-download' };
      case 65:
        return { label: 'Heavy Rain', icon: 'pi-cloud-download' };

      case 66:
        return { label: 'Light Freezing Rain', icon: 'pi-snowflake' };
      case 67:
        return { label: 'Heavy Freezing Rain', icon: 'pi-snowflake' };

      case 71:
        return { label: 'Slight Snowfall', icon: 'pi-snowflake' };
      case 73:
        return { label: 'Moderate Snowfall', icon: 'pi-snowflake' };
      case 75:
        return { label: 'Heavy Snowfall', icon: 'pi-snowflake' };
      case 77:
        return { label: 'Snow Grains', icon: 'pi-snowflake' };

      case 80:
        return { label: 'Slight Rain Showers', icon: 'pi-cloud-download' };
      case 81:
        return { label: 'Moderate Rain Showers', icon: 'pi-cloud-download' };
      case 82:
        return { label: 'Violent Rain Showers', icon: 'pi-cloud-download' };

      case 85:
        return { label: 'Slight Snow Showers', icon: 'pi-snowflake' };
      case 86:
        return { label: 'Heavy Snow Showers', icon: 'pi-snowflake' };

      case 95:
        return { label: 'Thunderstorm', icon: 'pi-bolt' };
      case 96:
        return { label: 'Thunderstorm with Slight Hail', icon: 'pi-bolt' };
      case 99:
        return { label: 'Thunderstorm with Heavy Hail', icon: 'pi-bolt' };

      default:
        return { label: 'Unknown Condition', icon: 'pi-question-circle' };
    }
  }
}