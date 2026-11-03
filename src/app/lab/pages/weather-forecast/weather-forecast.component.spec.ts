import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../transloco-testing.module';
import { GeoLocation, WeatherData } from '../../model/weather.models';
import { LayoutService } from '../../service/layout.service';
import { WeatherForecastService } from '../../service/weather-forecast.service';
import { WeatherForecastComponent } from './weather-forecast.component';

describe('WeatherForecastComponent', () => {
  let component: WeatherForecastComponent;
  let fixture: ComponentFixture<WeatherForecastComponent>;
  let weatherServiceSpy: jasmine.SpyObj<WeatherForecastService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let layoutServiceMock: { loading: ReturnType<typeof signal<boolean>>; isBrowser: boolean };

  const mockGeoLocation: GeoLocation = {
    latitude: 51.5074,
    longitude: -0.1278,
    name: 'London',
    country: 'United Kingdom',
    displayName: 'London, United Kingdom'
  };

  const mockWeatherData: WeatherData = {
    current: {
      time: '2023-10-27T12:00',
      temperature_2m: 15.4,
      relative_humidity_2m: 65,
      apparent_temperature: 14.2,
      precipitation: 0,
      weather_code: 0,
      wind_speed_10m: 10
    },
    current_units: {
      temperature_2m: '°C',
      relative_humidity_2m: '%',
      apparent_temperature: '°C',
      precipitation: 'mm',
      wind_speed_10m: 'km/h'
    },
    hourly: {
      time: ['2023-10-27T12:00', '2023-10-27T13:00'],
      temperature_2m: [15.4, 16.1],
      weather_code: [0, 1]
    },
    daily: {
      time: ['2023-10-27'],
      weather_code: [0],
      temperature_2m_max: [18.5],
      temperature_2m_min: [10.2],
      precipitation_sum: [0]
    }
  };

  beforeEach(async () => {
    weatherServiceSpy = jasmine.createSpyObj('WeatherForecastService', [
      'getClientLocation',
      'searchCities',
      'getWeather',
      'getWeatherCondition',
      'getTranslatedLocation'
    ]);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    layoutServiceMock = {
      loading: signal(false),
      isBrowser: true
    };

    weatherServiceSpy.getClientLocation.and.returnValue(of(mockGeoLocation));
    weatherServiceSpy.searchCities.and.returnValue(of([mockGeoLocation]));
    weatherServiceSpy.getWeather.and.returnValue(of(mockWeatherData));
    weatherServiceSpy.getWeatherCondition.and.returnValue({ label: 'Clear Sky', icon: 'pi-sun' });
    weatherServiceSpy.getTranslatedLocation.and.returnValue(of(mockGeoLocation));

    await TestBed.configureTestingModule({
      imports: [WeatherForecastComponent, NoopAnimationsModule, getTranslocoModule()],
      providers: [
        { provide: WeatherForecastService, useValue: weatherServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: LayoutService, useValue: layoutServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherForecastComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngOnInit)', () => {
    it('should initialize location from IP and load weather when running in browser', () => {
      expect(weatherServiceSpy.getClientLocation).toHaveBeenCalled();
      expect(component.activeLocation()).toEqual(mockGeoLocation);
      expect(weatherServiceSpy.getWeather).toHaveBeenCalledWith(
        mockGeoLocation.latitude,
        mockGeoLocation.longitude,
        'C'
      );
      expect(component.weather()).toEqual(mockWeatherData);
    });

    it('should stop loading indicator if getClientLocation fails', () => {
      weatherServiceSpy.getClientLocation.and.returnValue(throwError(() => new Error('API Rate Limit')));

      component['initLocationFromIP']();

      expect(layoutServiceMock.loading()).toBeFalse();
    });

    it('should not override a manually selected location when IP lookup is pending', () => {
      const ipResponse = new Subject<GeoLocation>();
      weatherServiceSpy.getClientLocation.and.returnValue(ipResponse);

      const localFixture = TestBed.createComponent(WeatherForecastComponent);
      const localComponent = localFixture.componentInstance;

      localFixture.detectChanges();

      const selectedLocation = {
        ...mockGeoLocation,
        latitude: 48.8566,
        longitude: 2.3522,
        name: 'Paris'
      };

      localComponent.onLocationSelect({
        originalEvent: {} as any,
        value: selectedLocation
      });

      ipResponse.next(mockGeoLocation);

      expect(localComponent.activeLocation()).toEqual(selectedLocation);

      localFixture.destroy();
    });
  });

  describe('Search functionality', () => {
    it('should debounce search input and update suggestions', fakeAsync(() => {
      const localFixture = TestBed.createComponent(WeatherForecastComponent);
      const localComponent = localFixture.componentInstance;

      localFixture.detectChanges();
      localComponent.searchQuery.set('Lon');
      localFixture.detectChanges();

      tick(300);

      expect(weatherServiceSpy.searchCities).toHaveBeenCalledWith('Lon', 'en');
      expect(localComponent.suggestions()).toEqual([mockGeoLocation]);

      localFixture.destroy();
    }));

    it('should set selected location and load weather on autocomplete select', () => {
      weatherServiceSpy.getWeather.calls.reset();

      component.onLocationSelect({
        originalEvent: {} as any,
        value: mockGeoLocation
      });

      expect(component.activeLocation()).toEqual(mockGeoLocation);
      expect(weatherServiceSpy.getWeather).toHaveBeenCalled();
    });

    it('should accept zero latitude and longitude', () => {
      const locationAtZero = {
        ...mockGeoLocation,
        latitude: 0,
        longitude: 0
      };

      weatherServiceSpy.getWeather.calls.reset();

      component.onLocationSelect({
        originalEvent: {} as any,
        value: locationAtZero
      });

      expect(component.activeLocation()).toEqual(locationAtZero);
      expect(weatherServiceSpy.getWeather).toHaveBeenCalledWith(0, 0, 'C');
    });
  });

  describe('Computed Signals', () => {
    it('should correctly round current temperature', () => {
      expect(component.currentTemp()).toBe(15);
    });

    it('should correctly build daily forecast data', () => {
      const daily = component.dailyForecast();
      expect(daily.length).toBe(1);
      expect(daily[0].maxTemp).toBe(19);
      expect(daily[0].minTemp).toBe(10);
      expect(daily[0].condition.label).toBe('Clear Sky');
    });

    it('should preserve forecast location time in hourly entries', () => {
      expect(component.hourlyForecast()[0].time).toBe('2023-10-27T12:00Z');
    });

    it('should not show past hours when current hour is outside the forecast range', () => {
      component.weather.set({
        ...mockWeatherData,
        current: {
          ...mockWeatherData.current,
          time: '2023-10-28T12:00'
        }
      });

      expect(component.hourlyForecast()).toEqual([]);
    });

    it('should clear all data on onClear()', () => {
      component.onClear();

      expect(component.selectedLocation()).toBeNull();
      expect(component.activeLocation()).toBeNull();
      expect(component.weather()).toBeNull();
      expect(component.suggestions()).toEqual([]);
      expect(component.searchQuery()).toBe('');
    });

    it('should cancel pending weather requests when location is cleared', () => {
      const weatherResponse = new Subject<WeatherData>();
      weatherServiceSpy.getWeather.and.returnValue(weatherResponse);

      component.onLocationSelect({
        originalEvent: {} as any,
        value: mockGeoLocation
      });

      expect(layoutServiceMock.loading()).toBeTrue();

      component.onClear();
      weatherResponse.next(mockWeatherData);

      expect(component.weather()).toBeNull();
      expect(layoutServiceMock.loading()).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    it('should display an error message if getWeather fails', () => {
      weatherServiceSpy.getWeather.and.returnValue(throwError(() => new Error('Network Error')));

      component.onLocationSelect({
        originalEvent: {} as any,
        value: mockGeoLocation
      });

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Failed to fetch weather data',
        detail: 'Network Error'
      });
      expect(layoutServiceMock.loading()).toBeFalse();
    });
  });

  describe('Unit Switching', () => {
    it('should reload weather data when unit is changed', () => {
      weatherServiceSpy.getWeather.calls.reset();

      component.onUnitChange('F');

      expect(component.tempUnit()).toBe('F');
      expect(weatherServiceSpy.getWeather).toHaveBeenCalledWith(
        mockGeoLocation.latitude,
        mockGeoLocation.longitude,
        'F'
      );
    });
  });
});