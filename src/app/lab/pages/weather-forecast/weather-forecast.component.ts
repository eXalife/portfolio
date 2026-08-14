import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';

import { DailyForecastItem, GeoLocation, HourlyForecastItem, WeatherCondition, WeatherData } from '../../model/weather.models';
import { LayoutService } from '../../service/layout.service';
import { WeatherForecastService } from '../../service/weather-forecast.service';

type TempUnit = 'C' | 'F';
type TimeFormat = '12h' | '24h';

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TagModule, DatePipe, SelectButtonModule],
  templateUrl: './weather-forecast.component.html',
  styleUrl: './weather-forecast.component.scss'
})
export class WeatherForecastComponent {
  private layoutService = inject(LayoutService);
  private weatherForecastService = inject(WeatherForecastService);
  private messageService = inject(MessageService);

  readonly loading = this.layoutService.loading;

  readonly tempUnitOptions = [
    { label: '°C', value: 'C' },
    { label: '°F', value: 'F' }
  ];

  readonly timeFormatOptions = [
    { label: '12H', value: '12h' },
    { label: '24H', value: '24h' }
  ];

  selectedCity = signal<GeoLocation | null>(null);
  activeCity = signal<GeoLocation | null>(null);
  suggestions = signal<GeoLocation[]>([]);
  weather = signal<WeatherData | null>(null);

  tempUnit = signal<TempUnit>('C');
  timeFormat = signal<TimeFormat>('24h');

  condition = computed<WeatherCondition>(() => {
    const code = this.weather()?.current?.weather_code;
    return code !== undefined
      ? this.weatherForecastService.getWeatherCondition(code)
      : { label: '', icon: '' };
  });

  currentTemp = computed(() => {
    const raw = this.weather()?.current?.temperature_2m;
    return raw != null ? Math.round(raw) : null;
  });

  currentApparentTemp = computed(() => {
    const raw = this.weather()?.current?.apparent_temperature;
    return raw != null ? Math.round(raw) : null;
  });

  hourlyForecast = computed<HourlyForecastItem[]>(() => {
    const data = this.weather();
    if (!data?.hourly?.time) return [];

    const now = new Date();
    let startIndex = data.hourly.time.findIndex(t => new Date(t) >= now);
    if (startIndex === -1) startIndex = 0;

    return data.hourly.time.slice(startIndex, startIndex + 24).map((time, idx) => {
      const realIndex = startIndex + idx;
      const code = data.hourly.weather_code[realIndex];

      return {
        time,
        temperature: Math.round(data.hourly.temperature_2m[realIndex]),
        weatherCode: code,
        condition: this.weatherForecastService.getWeatherCondition(code)
      };
    });
  });

  dailyForecast = computed<DailyForecastItem[]>(() => {
    const data = this.weather();
    if (!data?.daily?.time) return [];

    return data.daily.time.map((date, idx) => {
      const code = data.daily.weather_code[idx];
      return {
        date,
        weatherCode: code,
        maxTemp: Math.round(data.daily.temperature_2m_max[idx]),
        minTemp: Math.round(data.daily.temperature_2m_min[idx]),
        precipitation: data.daily.precipitation_sum[idx] ?? 0,
        condition: this.weatherForecastService.getWeatherCondition(code)
      };
    });
  });

  search(event: AutoCompleteCompleteEvent): void {
    this.weatherForecastService.searchCities(event.query).subscribe({
      next: (results) => this.suggestions.set(results),
      error: () => this.suggestions.set([])
    });
  }

  onCitySelect(event: AutoCompleteSelectEvent): void {
    const city = event.value as GeoLocation;
    if (!city?.latitude || !city?.longitude) return;

    this.activeCity.set(city);
    this.loadWeather();
  }

  onUnitChange(unit: TempUnit): void {
    this.tempUnit.set(unit);
    if (this.activeCity()) {
      this.loadWeather();
    }
  }

  onClear(): void {
    this.selectedCity.set(null);
    this.activeCity.set(null);
    this.weather.set(null);
    this.suggestions.set([]);
  }

  private loadWeather(): void {
    const city = this.activeCity();
    if (!city) return;

    this.loading.set(true);
    this.weatherForecastService.getWeather(city.latitude, city.longitude, this.tempUnit()).subscribe({
      next: (data) => {
        this.weather.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to fetch weather data',
          detail: err?.message || 'Error occurred'
        });
        this.loading.set(false);
      }
    });
  }
}