import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { afterNextRender, Component, computed, signal } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AutoContrastDirective } from '../../../directive/auto-contrast.directive';

interface Color {
  hex: string;
  rgb: string;
  hsv: string;
  hsl: string;
}

@Component({
  selector: 'app-color-generator',
  standalone: true,
  imports: [UpperCasePipe, ButtonModule, AutoContrastDirective, ColorPickerModule, OverlayPanelModule, AccordionModule, NgTemplateOutlet],
  templateUrl: './color-generator.component.html',
  styleUrl: './color-generator.component.scss'
})
export class ColorGeneratorComponent {
  currentColor = signal<Color>({ hex: '', rgb: '', hsv: '', hsl: '' });
  colorShades = computed<Color[]>(() => this.currentColor().hex ? this.generateShades(this.currentColor().hex) : []);
  colorHistory = signal<string[]>([]);

  constructor(private messageService: MessageService) {
    afterNextRender(() => {
      this.setColor();
    });
  }

  setColor(hex?: string) {
    const hexValue = hex || this.getRandomHex();
    this.currentColor.set(this.createColorObjectFromHex(hexValue));
    this.putHistory(hexValue);
  }

  copyColorToClipboard(color: string) {
    navigator.clipboard.writeText(color).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `${color} copied to clipboard` });
    }).catch(err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not copy color' });
      console.error('Could not copy password: ', err);
    });
  }

  putHistory(color: string) {
    this.colorHistory.update(history => [color, ...history].slice(0, 10));
  }

  private getRandomHex(): string {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return `#${randomHex}`;
  }

  private generateShades(hex: string): Color[] {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const shades: Color[] = [];

    // Percentages to mix with white (positive) and black (negative)
    const steps = [0.67, 0.33, -0.33, -0.67];

    for (const step of steps) {
      const newR = step < 0 ? Math.round(r * (1 + step)) : Math.round(r + (255 - r) * step);
      const newG = step < 0 ? Math.round(g * (1 + step)) : Math.round(g + (255 - g) * step);
      const newB = step < 0 ? Math.round(b * (1 + step)) : Math.round(b + (255 - b) * step);

      const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
      shades.push(this.createColorObjectFromHex(newHex));
    }

    return shades;
  }

  private createColorObjectFromHex(hex: string): Color {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

    return {
      hex: `#${cleanHex}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsv: this.rgbToHsv(r, g, b),
      hsl: this.rgbToHsl(r, g, b)
    };
  }

  private rgbToHsl(r: number, g: number, b: number): string {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
  }

  private rgbToHsv(r: number, g: number, b: number): string {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const vPct = Math.round(v * 100);

    return `hsv(${hDeg}, ${sPct}%, ${vPct}%)`;
  }
}