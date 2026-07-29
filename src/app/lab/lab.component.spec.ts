import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { Subject } from 'rxjs';
import { LayoutService } from '../service/layout.service';
import { LabComponent } from './lab.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

class MockLayoutService {
  isBrowser = true;
  overlayOpen$ = new Subject<void>();

  configUpdate$ = new Subject<any>();
  stateChanged$ = new Subject<any>();

  state = {
    staticMenuMobileActive: false,
    overlayMenuActive: false,
    menuHoverActive: false,
    profileSidebarVisible: false,
    staticMenuDesktopInactive: false
  };

  _config = {
    colorScheme: 'light',
    menuMode: 'static',
    inputStyle: 'filled',
    ripple: true
  };

  config() {
    return this._config;
  }
}

class MockPrimeNGConfig {
  ripple = false;
}

describe('LabComponent', () => {
  let component: LabComponent;
  let fixture: ComponentFixture<LabComponent>;
  let layoutService: MockLayoutService;
  let primengConfig: MockPrimeNGConfig;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: LayoutService, useClass: MockLayoutService },
        { provide: PrimeNGConfig, useClass: MockPrimeNGConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LabComponent);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(LayoutService) as unknown as MockLayoutService;
    primengConfig = TestBed.inject(PrimeNGConfig) as unknown as MockPrimeNGConfig;

    component.appSidebar = {
      el: new ElementRef(document.createElement('div'))
    } as any;

    component.appTopbar = {
      menuButton: new ElementRef(document.createElement('button')),
      menu: new ElementRef(document.createElement('ul')),
      topbarMenuButton: new ElementRef(document.createElement('button'))
    } as any;

    fixture.detectChanges();
  });

  afterEach(() => {
    // Cleanup body classes after manuplations
    document.body.classList.remove('blocked-scroll');
  });

  describe('Initialization & Environment', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize PrimeNG ripple and subscribe to overlayOpen$ if in browser', () => {
      expect(primengConfig.ripple).toBeTrue();
      expect(component.overlayMenuOpenSubscription).toBeDefined();
    });

    it('should NOT subscribe or set ripple if NOT in browser (SSR)', () => {
      const ssrLayoutService = new MockLayoutService();
      ssrLayoutService.isBrowser = false;
      const ssrPrimengConfig = new MockPrimeNGConfig();
      const renderer = jasmine.createSpyObj('Renderer2', ['listen']);

      const ssrComponent = new LabComponent(
        ssrLayoutService as any,
        renderer,
        {} as any,
        ssrPrimengConfig as any
      );

      expect(ssrPrimengConfig.ripple).toBeFalse();
      expect(ssrComponent.overlayMenuOpenSubscription).toBeUndefined();
    });
  });

  describe('Overlay & Click Listeners Logic', () => {
    it('should register outside click listeners when overlayOpen$ emits', () => {
      layoutService.overlayOpen$.next();

      expect(component.menuOutsideClickListener).toBeDefined();
      expect(component.profileMenuOutsideClickListener).toBeDefined();
    });

    it('should block body scroll when overlayOpen$ emits AND staticMenuMobileActive is true', () => {
      layoutService.state.staticMenuMobileActive = true;
      spyOn(component, 'blockBodyScroll').and.callThrough();

      layoutService.overlayOpen$.next();

      expect(component.blockBodyScroll).toHaveBeenCalled();
      expect(document.body.classList.contains('blocked-scroll')).toBeTrue();
    });

    it('should trigger hideMenu when clicking outside the sidebar and menu button', () => {
      spyOn(component, 'hideMenu');
      layoutService.overlayOpen$.next();

      // Simulating a click outside of topbar
      document.dispatchEvent(new Event('click'));

      expect(component.hideMenu).toHaveBeenCalled();
    });

    it('should NOT trigger hideMenu when clicking inside the sidebar', () => {
      spyOn(component, 'hideMenu');
      layoutService.overlayOpen$.next();

      // Simulating an inside click
      const sidebarEl = component.appSidebar.el.nativeElement;
      sidebarEl.dispatchEvent(new Event('click', { bubbles: true }));

      expect(component.hideMenu).not.toHaveBeenCalled();
    });

    it('should trigger hideProfileMenu when clicking outside the profile menu', () => {
      spyOn(component, 'hideProfileMenu');
      layoutService.overlayOpen$.next();

      document.dispatchEvent(new Event('click'));

      expect(component.hideProfileMenu).toHaveBeenCalled();
    });
  });

  describe('State Reset Methods', () => {
    it('should reset menu state and unblock body scroll on hideMenu()', () => {
      layoutService.state.overlayMenuActive = true;
      layoutService.state.staticMenuMobileActive = true;
      layoutService.state.menuHoverActive = true;

      const mockUnlisten = jasmine.createSpy('mockUnlisten');
      component.menuOutsideClickListener = mockUnlisten;
      spyOn(component, 'unblockBodyScroll').and.callThrough();

      component.hideMenu();

      expect(layoutService.state.overlayMenuActive).toBeFalse();
      expect(layoutService.state.staticMenuMobileActive).toBeFalse();
      expect(layoutService.state.menuHoverActive).toBeFalse();
      expect(mockUnlisten).toHaveBeenCalled();
      expect(component.menuOutsideClickListener).toBeNull();
      expect(component.unblockBodyScroll).toHaveBeenCalled();
    });

    it('should reset profile menu state on hideProfileMenu()', () => {
      layoutService.state.profileSidebarVisible = true;

      const mockUnlisten = jasmine.createSpy('mockUnlisten');
      component.profileMenuOutsideClickListener = mockUnlisten;

      component.hideProfileMenu();

      expect(layoutService.state.profileSidebarVisible).toBeFalse();
      expect(mockUnlisten).toHaveBeenCalled();
      expect(component.profileMenuOutsideClickListener).toBeNull();
    });
  });

  describe('DOM Manipulation (Body Scroll)', () => {
    it('should add "blocked-scroll" to document body', () => {
      component.blockBodyScroll();
      expect(document.body.classList.contains('blocked-scroll')).toBeTrue();
    });

    it('should remove "blocked-scroll" from document body', () => {
      document.body.classList.add('blocked-scroll');
      component.unblockBodyScroll();
      expect(document.body.classList.contains('blocked-scroll')).toBeFalse();
    });
  });

  describe('Getters', () => {
    it('should return the correct containerClass object based on layout configuration', () => {
      layoutService._config.colorScheme = 'dark';
      layoutService._config.menuMode = 'overlay';
      layoutService._config.inputStyle = 'filled';
      layoutService._config.ripple = false;

      layoutService.state.overlayMenuActive = true;
      layoutService.state.staticMenuMobileActive = true;
      layoutService.state.staticMenuDesktopInactive = true;

      const classes = component.containerClass;

      expect(classes['layout-theme-dark']).toBeTrue();
      expect(classes['layout-theme-light']).toBeFalse();
      expect(classes['layout-overlay']).toBeTrue();
      expect(classes['layout-static']).toBeFalse();
      expect(classes['layout-overlay-active']).toBeTrue();
      expect(classes['layout-mobile-active']).toBeTrue();
      expect(classes['p-input-filled']).toBeTrue();
      expect(classes['p-ripple-disabled']).toBeTrue();
    });
  });
});