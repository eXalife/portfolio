import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WeatherForecastComponent } from './weather-forecast.component';
import { WeatherForecastService } from '../../service/weather-forecast.service';
import { LayoutService } from '../../service/layout.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { GeoLocation, WeatherData } from '../../model/weather.models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WeatherForecastComponent', () => {
  let component: WeatherForecastComponent;
  let fixture: ComponentFixture<WeatherForecastComponent>;
  let weatherServiceSpy: jasmine.SpyObj<WeatherForecastService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let layoutServiceMock: any;

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
      'getWeatherCondition'
    ]);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    layoutServiceMock = {
      loading: signal(false)
    };

    weatherServiceSpy.getClientLocation.and.returnValue(of(mockGeoLocation));
    weatherServiceSpy.searchCities.and.returnValue(of([mockGeoLocation]));
    weatherServiceSpy.getWeather.and.returnValue(of(mockWeatherData));
    weatherServiceSpy.getWeatherCondition.and.returnValue({ label: 'Clear Sky', icon: 'pi-sun' });

    await TestBed.configureTestingModule({
      imports: [WeatherForecastComponent, NoopAnimationsModule],
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

  describe('Initialization (afterNextRender)', () => {
    it('should initialize location from IP and load weather', () => {
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
  });

  describe('Search functionality', () => {
    it('should debounce search input and update suggestions', fakeAsync(() => {
      const localFixture = TestBed.createComponent(WeatherForecastComponent);
      const localComponent = localFixture.componentInstance;

      localFixture.detectChanges();

      localComponent.searchQuery.set('Lon');

      localFixture.detectChanges();

      tick(300);

      expect(weatherServiceSpy.searchCities).toHaveBeenCalledWith('Lon');
      expect(localComponent.suggestions()).toEqual([mockGeoLocation]);
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

    it('should clear all data on onClear()', () => {
      component.onClear();

      expect(component.selectedLocation()).toBeNull();
      expect(component.activeLocation()).toBeNull();
      expect(component.weather()).toBeNull();
      expect(component.suggestions()).toEqual([]);
      expect(component.searchQuery()).toBe('');
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