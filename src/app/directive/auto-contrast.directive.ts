import { Directive, ElementRef, Renderer2, effect, input } from '@angular/core';

@Directive({
  selector: '[autoContrast]',
  standalone: true
})
export class AutoContrastDirective {
  bgColor = input.required<string>({ alias: 'autoContrast' });

  constructor(private el: ElementRef, private renderer: Renderer2) {
    effect(() => {
      const textColor = this.getContrastColor(this.bgColor());
      this.renderer.setStyle(this.el.nativeElement, 'color', textColor);
    });
  }

  private getContrastColor(hex: string): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    // WCAG Luminance calculations
    const rgb = [r, g, b].map(c => {
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return luminance > 0.179 ? '#000000' : '#ffffff';
  }
}