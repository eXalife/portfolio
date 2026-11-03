import { DatePipe, registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';

import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { DailyForecastItem, GeoLocation, HourlyForecastItem, WeatherCondition, WeatherData } from '../../model/weather.models';
import { LayoutService } from '../../service/layout.service';
import { WeatherForecastService } from '../../service/weather-forecast.service';

type TempUnit = 'C' | 'F';
type TimeFormat = '12h' | '24h';
registerLocaleData(localeTr, 'tr-TR')

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [FormsModule, TranslocoModule, AutoCompleteModule, TagModule, DatePipe, SelectButtonModule],
  templateUrl: './weather-forecast.component.html',
  styleUrl: './weather-forecast.component.scss'
})
export class WeatherForecastComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private weatherForecastService = inject(WeatherForecastService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private activeLang = toSignal(this.translocoService.langChanges$, { initialValue: this.translocoService.getActiveLang() });
  private readonly weatherRequests = new Subject<{ location: GeoLocation; unit: TempUnit } | null>();
  private readonly cancelInitialLocation$ = new Subject<void>();

  readonly loading = this.layoutService.loading;
  readonly dateLocale = computed(() => this.activeLang().startsWith('tr') ? 'tr-TR' : 'en-US');

  readonly tempUnitOptions = [
    { label: '°C', value: 'C' },
    { label: '°F', value: 'F' }
  ];

  readonly timeFormatOptions = [
    { label: '12H', value: '12h' },
    { label: '24H', value: '24h' }
  ];

  searchQuery = signal<string>('');
  selectedLocation = signal<GeoLocation | string | null>(null);
  activeLocation = signal<GeoLocation | null>(null);
  suggestions = signal<GeoLocation[]>([]);
  weather = signal<WeatherData | null>(null);

  tempUnit = signal<TempUnit>('C');
  timeFormat = signal<TimeFormat>('24h');

  condition = computed<WeatherCondition>(() => {
    const code = this.weather()?.current?.weather_code;
    return code != null
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
    if (!data?.hourly?.time || !data?.current?.time) return [];

    const currentHour = data.current.time.slice(0, 13);
    const startIndex = data.hourly.time.findIndex(time => time.slice(0, 13) >= currentHour);
    if (startIndex === -1) return [];

    return data.hourly.time.slice(startIndex, startIndex + 24).map((time, idx) => {
      const realIndex = startIndex + idx;
      const code = data.hourly.weather_code[realIndex];

      return {
        time: `${time.slice(0, 16)}Z`,
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
        condition: this.weatherForecastService.getWeatherCondition(code)
      };
    });
  });

  constructor() {
    this.weatherRequests.pipe(
      switchMap(request => {
        if (!request) return of(null);

        this.loading.set(true);
        this.weather.set(null);

        return this.weatherForecastService.getWeather(request.location.latitude, request.location.longitude, request.unit).pipe(
          catchError(err => {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('weather.errors.fetchFailed'),
              detail: err?.message || this.translocoService.translate('weather.errors.occurred')
            });
            return of(null);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.weather.set(data));

    combineLatest([toObservable(this.searchQuery), toObservable(this.activeLang)]).pipe(
      debounceTime(300),
      distinctUntilChanged(([prevQuery, prevLang], [query, lang]) => prevQuery === query && prevLang === lang),
      switchMap(([query, lang]) => {
        if (!query) return of([]);
        return this.weatherForecastService.searchCities(query, lang).pipe(catchError(() => of([])));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => this.suggestions.set(results));

    combineLatest([toObservable(this.activeLocation), toObservable(this.activeLang)]).pipe(
      distinctUntilChanged(([prevLocation, prevLang], [location, lang]) =>
        prevLang === lang && (
          prevLocation === location ||
          (!!prevLocation && !!location &&
            (prevLocation.id != null && location.id != null
              ? prevLocation.id === location.id
              : prevLocation.latitude === location.latitude && prevLocation.longitude === location.longitude))
        )
      ),
      switchMap(([location, lang]) => {
        if (!location) return of(null);
        return this.weatherForecastService.getTranslatedLocation(location, lang).pipe(
          catchError(() => of(location))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(location => {
      if (location) {
        this.activeLocation.set(location);
        if (typeof this.selectedLocation() !== 'string') {
          this.selectedLocation.set(location);
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.layoutService.isBrowser) {
      this.initLocationFromIP();
    }
  }

  private initLocationFromIP(): void {
    this.loading.set(true);
    this.weatherForecastService.getClientLocation().pipe(
      takeUntil(this.cancelInitialLocation$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (geoLocation) => {
        this.selectedLocation.set(geoLocation);
        this.activeLocation.set(geoLocation);
        this.loadWeather();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  search(event: AutoCompleteCompleteEvent): void {
    if (event.query?.trim() && !this.activeLocation()) {
      this.cancelInitialLocation$.next();
      this.loading.set(false);
    }
    this.searchQuery.set(event.query);
  }

  onLocationSelect(event: AutoCompleteSelectEvent): void {
    const location = event.value as GeoLocation;
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return;

    this.cancelInitialLocation$.next();
    this.selectedLocation.set(location);
    this.activeLocation.set(location);
    this.loadWeather();
  }

  onUnitChange(unit: TempUnit): void {
    if (this.tempUnit() === unit) return;

    this.tempUnit.set(unit);
    if (this.activeLocation()) {
      this.loadWeather();
    }
  }

  onClear(): void {
    this.cancelInitialLocation$.next();
    this.weatherRequests.next(null);
    this.selectedLocation.set(null);
    this.activeLocation.set(null);
    this.weather.set(null);
    this.suggestions.set([]);
    this.searchQuery.set('');
    this.loading.set(false);
  }

  private loadWeather(): void {
    const location = this.activeLocation();
    this.weatherRequests.next(location ? { location, unit: this.tempUnit() } : null);
  }

  ngOnDestroy(): void {
    this.loading.set(false);
  }
}