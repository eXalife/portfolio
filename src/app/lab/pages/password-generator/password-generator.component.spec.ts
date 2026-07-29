import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PasswordGeneratorComponent } from './password-generator.component';
import { LayoutService } from '../../../service/layout.service';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('PasswordGeneratorComponent', () => {
  let component: PasswordGeneratorComponent;
  let fixture: ComponentFixture<PasswordGeneratorComponent>;
  let layoutService: LayoutService;
  let messageService: MessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordGeneratorComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordGeneratorComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(LayoutService);
    messageService = TestBed.inject(MessageService);

    spyOn(messageService, 'add');

    layoutService.isBrowser = true;

    // Mock window.crypto if running in an environment without it (like older JSDOM)
    if (!window.crypto || !window.crypto.getRandomValues) {
      Object.defineProperty(window, 'crypto', {
        value: {
          getRandomValues: (buffer: Uint32Array) => {
            for (let i = 0; i < buffer.length; i++) {
              buffer[i] = Math.floor(Math.random() * 4294967296);
            }
            return buffer;
          }
        }
      });
    }

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit & SSR Behavior', () => {
    it('should generate password on initialization in browser environment', () => {
      spyOn(component, 'generatePassword').and.callThrough();
      component.ngOnInit();
      expect(component.generatePassword).toHaveBeenCalled();
      expect(component.password.length).toBe(24);
    });

    it('should NOT generate password on initialization in SSR environment', () => {
      layoutService.isBrowser = false;
      component.password = '';

      component.ngOnInit();
      component.generatePassword(); // Manually triggering to ensure early return

      expect(component.password).toBe('');
    });
  });

  describe('Character Customization', () => {
    it('should disable standard character flags when customization is enabled', () => {
      component.customize = true;
      component.customizeChars();

      expect(component.includeUppercase).toBeFalse();
      expect(component.includeLowercase).toBeFalse();
      expect(component.includeNumbers).toBeFalse();
      expect(component.includeSymbols).toBeFalse();
    });

    it('should restore standard character flags and reset string when customization is disabled', () => {
      component.customize = false;
      component.customChars = 'abc';
      component.customizeChars();

      expect(component.includeUppercase).toBeTrue();
      expect(component.includeLowercase).toBeTrue();
      expect(component.includeNumbers).toBeTrue();
      expect(component.includeSymbols).toBeTrue();
      expect(component.customChars.length).toBeGreaterThan(3);
    });
  });

  describe('Password Generation Constraints', () => {
    it('should enforce minimum password length', () => {
      component.passwordLength.set(2); // Below min of 4
      component.generatePassword();

      expect(component.passwordLength()).toBe(4);
      expect(component.password.length).toBe(4);
    });

    it('should enforce maximum password length', () => {
      component.passwordLength.set(300); // Above max of 256
      component.generatePassword();

      expect(component.passwordLength()).toBe(256);
      expect(component.password.length).toBe(256);
    });

    it('should return empty password if no character sets are selected', () => {
      component.includeUppercase = false;
      component.includeLowercase = false;
      component.includeNumbers = false;
      component.includeSymbols = false;
      component.customize = false;

      component.generatePassword();

      expect(component.password).toBe('');
    });
  });

  describe('Custom Characters Logic', () => {
    it('should remove duplicate custom characters and show info message', fakeAsync(() => {
      component.customize = true;
      component.customChars = 'aabbccddee';
      component.generatePassword();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'info',
        detail: 'Duplicate characters removed from custom characters'
      }));

      tick();

      expect(component.customChars).toBe('abcde');
    }));
  });

  describe('Clipboard Operations', () => {
    it('should successfully copy password to clipboard', fakeAsync(() => {
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };

      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true
      });

      component.password = 'TestPassword123!';
      component.copyPasswordToClipboard();

      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TestPassword123!');
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Success'
      }));
    }));

    it('should handle clipboard copy failure gracefully', fakeAsync(() => {
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.reject('Permission denied'))
      };

      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true
      });

      spyOn(console, 'error');

      component.copyPasswordToClipboard();

      tick();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Error'
      }));
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Easter Egg', () => {
    it('should increase max password length after 8 rapid clicks', fakeAsync(() => {
      expect(component.maxPasswordLength).toBe(256);

      for (let i = 0; i < 8; i++) {
        component.unlockEasterEgg();
      }

      expect(component.maxPasswordLength).toBe(16384);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'contrast',
        summary: 'Easter Egg Unlocked!'
      }));

      tick(1000);
    }));

    it('should reset click count if clicks are too slow', fakeAsync(() => {
      component.unlockEasterEgg();
      tick(1500);
      component.unlockEasterEgg();

      for (let i = 0; i < 6; i++) {
        component.unlockEasterEgg();
      }

      expect(component.maxPasswordLength).toBe(256);
      tick(1000);
    }));
  });
});