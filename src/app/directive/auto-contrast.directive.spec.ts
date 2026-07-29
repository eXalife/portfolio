import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoContrastDirective } from './auto-contrast.directive';

@Component({
  template: `<div [autoContrast]="bgColor">Test Text</div>`,
  standalone: true,
  imports: [AutoContrastDirective]
})
class TestHostComponent {
  bgColor = '#ffffff';
}

describe('AutoContrastDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let divElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, AutoContrastDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;

    divElement = fixture.debugElement.query(By.css('div')).nativeElement;
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });

  it('should set text color to black for a light background (#ffffff)', () => {
    component.bgColor = '#ffffff';
    fixture.detectChanges();

    expect(divElement.style.color).toBe('rgb(0, 0, 0)');
  });

  it('should set text color to white for a dark background (#000000)', () => {
    component.bgColor = '#000000';
    fixture.detectChanges();

    expect(divElement.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should handle 3-character hex codes properly (#000)', () => {
    component.bgColor = '#000';
    fixture.detectChanges();

    expect(divElement.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should handle 3-character hex codes properly (#fff)', () => {
    component.bgColor = '#fff';
    fixture.detectChanges();

    expect(divElement.style.color).toBe('rgb(0, 0, 0)');
  });

  it('should handle hex codes missing the # symbol (000000)', () => {
    component.bgColor = '000000';
    fixture.detectChanges();

    expect(divElement.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should dynamically update the color when the input changes', () => {
    component.bgColor = '#ffffff';
    fixture.detectChanges();
    expect(divElement.style.color).toBe('rgb(0, 0, 0)');

    component.bgColor = '#222222';
    fixture.detectChanges();
    expect(divElement.style.color).toBe('rgb(255, 255, 255)');
  });
});