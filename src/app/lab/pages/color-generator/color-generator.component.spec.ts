import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ColorGeneratorComponent, ColorType } from './color-generator.component';

describe('ColorGeneratorComponent', () => {
  let component: ColorGeneratorComponent;
  let fixture: ComponentFixture<ColorGeneratorComponent>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    const msgSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ColorGeneratorComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MessageService, useValue: msgSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorGeneratorComponent);
    component = fixture.componentInstance;

    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    const mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true
    });

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Color State and Conversions', () => {
    it('should set a HEX color correctly and update RGB, HSL, and HSV equivalents', () => {
      component.setColor('#FF0000', ColorType.HEX);

      const current = component.currentColor();
      expect(current.hex).toBe('#FF0000');
      expect(current.rgb).toBe('rgb(255, 0, 0)');
      expect(current.hsl).toBe('hsl(0, 100%, 50%)');
      expect(current.hsv).toBe('hsv(0, 100%, 100%)');
    });

    it('should set a color from RGB input correctly', () => {
      component.setColor('rgb(0, 255, 0)', ColorType.RGB);

      const current = component.currentColor();
      expect(current.hex).toBe('#00FF00');
      expect(current.rgb).toBe('rgb(0, 255, 0)');
    });

    it('should compute shades when a valid color is set', () => {
      component.setColor('#0000FF', ColorType.HEX);
      const shades = component.colorShades();

      expect(shades.length).toBeGreaterThan(0);
      expect(shades[0].hex).toBeDefined();
      expect(shades[0].rgb).toBeDefined();
    });

    it("should handle missing '#' gracefully when setting a HEX color", () => {
      component.setColor('FF0000', ColorType.HEX);
      expect(component.currentColor().hex).toBe('#FF0000');
    });

    it('should handle 3-digit HEX colors correctly', () => {
      component.setColor('F00', ColorType.HEX);
      expect(component.currentColor().hex).toBe('#FF0000');
    });
  });

  describe('History Management', () => {
    it('should add a color to the history', () => {
      component.colorHistory.set([]);

      component.putHistory('#123456');
      expect(component.colorHistory()).toContain('#123456');
    });

    it('should not add duplicate colors to history', () => {
      component.colorHistory.set([]);

      component.putHistory('#111111');
      component.putHistory('#222222');
      component.putHistory('#111111'); // Duplicate

      const history = component.colorHistory();
      expect(history.length).toBe(2);
      expect(history[0]).toBe('#222222');
      expect(history[1]).toBe('#111111');
    });

    it('should keep history limited to 10 items', () => {
      component.colorHistory.set([]);

      for (let i = 0; i < 15; i++) {
        const hex = `#${i.toString(16).padStart(6, '0')}`;
        component.putHistory(hex);
      }
      expect(component.colorHistory().length).toBe(10);
    });
  });

  describe('Clipboard Operations', () => {
    it('should copy text to clipboard and show success message', fakeAsync(() => {
      component.copyColorToClipboard('#FFFFFF');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#FFFFFF');

      tick();

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: '#FFFFFF',
        detail: 'Copied to clipboard'
      });
    }));
  });

  describe('Input Handlers', () => {
    it('should clamp RGB values between 0 and 255', () => {
      component.setColor('#000000', ColorType.HEX);
      fixture.detectChanges();

      const mockEvent = { target: { value: '300' } } as unknown as Event;
      component.onRgbInputChange('r', mockEvent);

      expect(component.rgbInput.r).toBe(255);
      expect(component.currentColor().hex).toBe('#FF0000');
    });

    it('should clamp HSL values (H between 0-360, S/L between 0-100)', () => {
      const mockEventH = { target: { value: '400' } } as unknown as Event; // Hue
      const mockEventS = { target: { value: '-10' } } as unknown as Event; // Saturation

      component.onHslInputChange('h', mockEventH);
      component.onHslInputChange('s', mockEventS);

      expect(component.hslInput.h).toBe(360);
      expect(component.hslInput.s).toBe(0);
    });

    it('should process HEX input and update color if 6 valid characters are provided', () => {
      const mockEvent = { target: { value: '00FF00' } } as unknown as Event;
      component.onHexInputChange(mockEvent);

      expect(component.hexInput).toBe('00FF00');
      expect(component.currentColor().hex).toBe('#00FF00');
    });

    it('should process 3-digit HEX input on blur and expand to 6 digits', () => {
      component.hexInput = 'F0F';
      component.onHexInputBlur();

      expect(component.hexInput).toBe('FF00FF');
      expect(component.currentColor().hex).toBe('#FF00FF');
      expect(component.isHexInputFocused).toBeFalse();
    });
  });

  describe('Component Effects', () => {
    it('should sync input models when currentColor signal changes', () => {
      component.currentColor.set({
        hex: '#00FF00',
        rgb: 'rgb(0, 255, 0)',
        hsv: 'hsv(120, 100%, 100%)',
        hsl: 'hsl(120, 100%, 50%)'
      });

      fixture.detectChanges();

      expect(component.rgbInput).toEqual({ r: 0, g: 255, b: 0 });
      expect(component.hslInput).toEqual({ h: 120, s: 100, l: 50 });
      expect(component.hsvInput).toEqual({ h: 120, s: 100, v: 100 });
      expect(component.hexInput).toBe('00FF00');
    });
  });
});