import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorGeneratorComponent } from './color-generator.component';

describe('ColorGeneratorComponent', () => {
  let component: ColorGeneratorComponent;
  let fixture: ComponentFixture<ColorGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorGeneratorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColorGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
