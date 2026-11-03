import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, catchError, map, of } from 'rxjs';
import { GeoLocation, GeocodingResponse, WeatherData } from '../model/weather.models';

@Injectable({
  providedIn: 'root'
})
export class WeatherForecastService {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  private readonly fallbackLocation: GeoLocation = {
    latitude: -78.558876,
    longitude: 106.70658,
    name: 'Vostok Station',
    admin1: 'Antarctica',
    country: 'Antarctica',
    displayName: 'Vostok Station, Antarctica'
  };

  getClientLocation(): Observable<GeoLocation> {
    return this.http.get<any>('https://api.cemtemucin.com/geolocation').pipe(
      map(res => {
        if (!res?.latitude || !res?.longitude) {
          return this.fallbackLocation;
        }

        return {
          latitude: parseFloat(res.latitude),
          longitude: parseFloat(res.longitude),
          name: res.city,
          admin1: res.region,
          country: res.country,
          displayName: [res.city, res.region, res.country].filter(Boolean).join(', ')
        } as GeoLocation;
      }),
      catchError(() => {
        this.messageService.add({
          severity: 'info',
          summary: this.translocoService.translate('weather.errors.locationUnavailable'),
          detail: this.translocoService.translate('weather.errors.ipLocationNotFound'),
          life: 10000
        });
        return of(this.fallbackLocation);
      })
    );
  }

  getTranslatedLocation(location: GeoLocation, language: string): Observable<GeoLocation> {
    const lang = language.split('-')[0].toLowerCase();

    if (location.id) {
      const params = new HttpParams()
        .set('id', location.id.toString())
        .set('language', lang);

      return this.http.get<GeoLocation>('https://geocoding-api.open-meteo.com/v1/get', { params }).pipe(
        map(item => ({
          ...location,
          ...item,
          displayName: [item.name, item.admin1, item.country].filter(Boolean).join(', ')
        }))
      );
    }

    return this.searchCities(location.name, lang).pipe(
      map(results => {
        if (!results.length) return location;

        return results.reduce((closest, item) => {
          const distance = (item.latitude - location.latitude) ** 2 + (item.longitude - location.longitude) ** 2;
          const closestDistance = (closest.latitude - location.latitude) ** 2 + (closest.longitude - location.longitude) ** 2;
          return distance < closestDistance ? item : closest;
        });
      })
    );
  }

  searchCities(query: string, language = this.translocoService.getActiveLang()): Observable<GeoLocation[]> {
    if (!query?.trim() || query.trim().length < 2) return of([]);

    const params = new HttpParams()
      .set('name', query.trim())
      .set('language', language.split('-')[0].toLowerCase());

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
        return { label: 'weather.conditions.clearSky', icon: 'pi-sun' };

      case 1:
        return { label: 'weather.conditions.mainlyClear', icon: 'pi-sun' };
      case 2:
        return { label: 'weather.conditions.partlyCloudy', icon: 'pi-cloud' };
      case 3:
        return { label: 'weather.conditions.overcast', icon: 'pi-cloud' };

      case 45:
        return { label: 'weather.conditions.fog', icon: 'pi-align-justify' };
      case 48:
        return { label: 'weather.conditions.depositingRimeFog', icon: 'pi-align-justify' };

      case 51:
        return { label: 'weather.conditions.lightDrizzle', icon: 'pi-cloud-download' };
      case 53:
        return { label: 'weather.conditions.moderateDrizzle', icon: 'pi-cloud-download' };
      case 55:
        return { label: 'weather.conditions.denseDrizzle', icon: 'pi-cloud-download' };

      case 56:
        return { label: 'weather.conditions.lightFreezingDrizzle', icon: 'pi-snowflake' };
      case 57:
        return { label: 'weather.conditions.denseFreezingDrizzle', icon: 'pi-snowflake' };

      case 61:
        return { label: 'weather.conditions.slightRain', icon: 'pi-cloud-download' };
      case 63:
        return { label: 'weather.conditions.moderateRain', icon: 'pi-cloud-download' };
      case 65:
        return { label: 'weather.conditions.heavyRain', icon: 'pi-cloud-download' };

      case 66:
        return { label: 'weather.conditions.lightFreezingRain', icon: 'pi-snowflake' };
      case 67:
        return { label: 'weather.conditions.heavyFreezingRain', icon: 'pi-snowflake' };

      case 71:
        return { label: 'weather.conditions.slightSnowfall', icon: 'pi-snowflake' };
      case 73:
        return { label: 'weather.conditions.moderateSnowfall', icon: 'pi-snowflake' };
      case 75:
        return { label: 'weather.conditions.heavySnowfall', icon: 'pi-snowflake' };
      case 77:
        return { label: 'weather.conditions.snowGrains', icon: 'pi-snowflake' };

      case 80:
        return { label: 'weather.conditions.slightRainShowers', icon: 'pi-cloud-download' };
      case 81:
        return { label: 'weather.conditions.moderateRainShowers', icon: 'pi-cloud-download' };
      case 82:
        return { label: 'weather.conditions.violentRainShowers', icon: 'pi-cloud-download' };

      case 85:
        return { label: 'weather.conditions.slightSnowShowers', icon: 'pi-snowflake' };
      case 86:
        return { label: 'weather.conditions.heavySnowShowers', icon: 'pi-snowflake' };

      case 95:
        return { label: 'weather.conditions.thunderstorm', icon: 'pi-bolt' };
      case 96:
        return { label: 'weather.conditions.thunderstormSlightHail', icon: 'pi-bolt' };
      case 99:
        return { label: 'weather.conditions.thunderstormHeavyHail', icon: 'pi-bolt' };

      default:
        return { label: 'weather.conditions.unknownCondition', icon: 'pi-question-circle' };
    }
  }
}