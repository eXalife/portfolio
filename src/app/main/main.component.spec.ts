import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    spyOn(component, 'stars');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should call stars() in ngAfterViewInit when running in the browser', () => {
    const starsSpy = spyOn(component, 'stars');
    fixture.detectChanges();
    expect(starsSpy).toHaveBeenCalled();
  });

  describe('stars() canvas logic', () => {
    it('should setup the canvas, bind resize event, and start animation', () => {
      const requestAnimationFrameSpy = spyOn(window, 'requestAnimationFrame').and.returnValue(123);
      const addEventListenerSpy = spyOn(window, 'addEventListener');
      const canvasElement = fixture.nativeElement.querySelector('#scene');

      const originalGetElementById = document.getElementById.bind(document);
      spyOn(document, 'getElementById').and.callFake((id: string) => {
        return id === 'scene' ? canvasElement : originalGetElementById(id);
      });

      fixture.detectChanges();

      expect(document.getElementById).toHaveBeenCalledWith('scene');
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(requestAnimationFrameSpy).toHaveBeenCalled();
      expect(canvasElement.width).toEqual(window.innerWidth);
      expect(canvasElement.height).toEqual(window.innerHeight);
    });

    it('should clean up event listeners and animation frame on destroy', () => {
      spyOn(window, 'requestAnimationFrame').and.returnValue(999);
      const removeEventListenerSpy = spyOn(window, 'removeEventListener');
      const cancelAnimationFrameSpy = spyOn(window, 'cancelAnimationFrame');

      fixture.detectChanges();
      fixture.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(999);
    });
  });
});

describe('MainComponent - Server environment (SSR)', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
  });

  it('should NOT call stars() in ngAfterViewInit when running on the server', () => {
    const starsSpy = spyOn(component, 'stars');
    fixture.detectChanges();
    expect(starsSpy).not.toHaveBeenCalled();
  });
});