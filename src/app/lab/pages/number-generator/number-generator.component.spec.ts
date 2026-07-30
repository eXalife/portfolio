import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NumberGeneratorComponent } from './number-generator.component';
import { MessageService } from 'primeng/api';
import { NoopAnimationsModule, provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

describe('NumberGeneratorComponent', () => {
  let component: NumberGeneratorComponent;
  let fixture: ComponentFixture<NumberGeneratorComponent>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [NumberGeneratorComponent, NoopAnimationsModule],
      providers: [
        { provide: MessageService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NumberGeneratorComponent);
    component = fixture.componentInstance;
    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.minInput).toBe('1');
      expect(component.maxInput).toBe('100');
      expect(component.randomNumber()).toBeNull();
      expect(component.minSafe).toBe(Number.MIN_SAFE_INTEGER);
      expect(component.maxSafe).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Input Handling (allowOnlyNumbers)', () => {
    it('should allow valid numeric strings', () => {
      const event = { target: { value: '12345' } } as unknown as Event;
      component.allowOnlyNumbers('min', event);
      expect(component.minInput).toBe('12345');
    });

    it('should allow negative sign at the beginning', () => {
      const event = { target: { value: '-123' } } as unknown as Event;
      component.allowOnlyNumbers('min', event);
      expect(component.minInput).toBe('-123');
    });

    it('should strip out non-numeric characters and misplaced negative signs', () => {
      const event = { target: { value: 'a1b-2c3' } } as unknown as Event;
      component.allowOnlyNumbers('max', event);
      expect(component.maxInput).toBe('123');
    });
  });

  describe('Random Number Generation', () => {
    it('should generate a number within the specified bounds', () => {
      component.minInput = '5';
      component.maxInput = '10';

      component.generateNumber();

      const result = component.randomNumber();
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
      expect(messageServiceSpy.add).not.toHaveBeenCalled();
    });

    it('should handle large valid bounds', () => {
      component.minInput = '1000000';
      component.maxInput = '2000000';

      component.generateNumber();

      const result = component.randomNumber();
      expect(result).toBeGreaterThanOrEqual(1000000);
      expect(result).toBeLessThanOrEqual(2000000);
    });

    it('should strip decimals and generate successfully', () => {
      component.minInput = '1.5';
      component.maxInput = '5.9';

      component.generateNumber();

      const result = component.randomNumber();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should show error if min is greater than max', () => {
      component.minInput = '100';
      component.maxInput = '1';

      component.generateNumber();

      expect(component.randomNumber()).toBeNull();
      expect(messageServiceSpy.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ summary: 'Error', detail: 'Min value cannot be greater than Max value.' })
      );
    });

    it('should show error if bounds exceed safe integers', () => {
      component.minInput = '1';
      component.maxInput = '9007199254740992';

      component.generateNumber();

      expect(component.randomNumber()).toBeNull();
      expect(messageServiceSpy.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ summary: 'Error', detail: `Values must be between ${component.minSafe} and ${component.maxSafe}.` })
      );
    });

    it('should show error on standalone negative sign or empty input', () => {
      component.minInput = '-';
      component.maxInput = '10';

      component.generateNumber();

      expect(component.randomNumber()).toBeNull();
      expect(messageServiceSpy.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ summary: 'Error', detail: 'Please enter valid integer numbers.' })
      );
    });
  });

  describe('Number to Words Conversion', () => {
    it('should return empty string for null', () => {
      expect(component.numberToWords(null)).toBe('');
    });

    it('should handle zero correctly', () => {
      expect(component.numberToWords(0)).toBe('zero');
    });

    it('should handle negative numbers', () => {
      expect(component.numberToWords(-42)).toBe('minus forty-two');
    });

    it('should handle numbers below 20', () => {
      expect(component.numberToWords(15)).toBe('fifteen');
      expect(component.numberToWords(7)).toBe('seven');
    });

    it('should handle tens and units', () => {
      expect(component.numberToWords(45)).toBe('forty-five');
      expect(component.numberToWords(90)).toBe('ninety');
    });

    it('should handle hundreds', () => {
      expect(component.numberToWords(105)).toBe('one hundred five');
      expect(component.numberToWords(300)).toBe('three hundred');
    });

    it('should handle large numbers with scales', () => {
      expect(component.numberToWords(1234)).toBe('one thousand two hundred thirty-four');
      expect(component.numberToWords(1000000)).toBe('one million');
      expect(component.numberToWords(1500000000)).toBe('one billion five hundred million');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset inputs and signal to default states', () => {
      component.minInput = '50';
      component.maxInput = '500';
      component.randomNumber.set(250);

      component.reset();

      expect(component.minInput).toBe('1');
      expect(component.maxInput).toBe('100');
      expect(component.randomNumber()).toBeNull();
    });
  });
});