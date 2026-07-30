import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoContrastDirective } from '../../../directive/auto-contrast.directive';

interface Color {
  hex: string;
  rgb: string;
  hsv: string;
  hsl: string;
}

export enum ColorType {
  HEX = 'hex',
  RGB = 'rgb',
  HSV = 'hsv',
  HSL = 'hsl',
}

@Component({
  selector: 'app-color-generator',
  standalone: true,
  imports: [FormsModule, ButtonModule, AutoContrastDirective, ColorPickerModule, OverlayPanelModule, AccordionModule, NgTemplateOutlet, SelectButtonModule, InputTextModule],
  templateUrl: './color-generator.component.html',
  styleUrl: './color-generator.component.scss'
})
export class ColorGeneratorComponent {
  currentColor = signal<Color>({ hex: '', rgb: '', hsv: '', hsl: '' });
  // compute shades based on current hex value
  colorShades = computed<Color[]>(() => this.currentColor().hex ? this.generateShades(this.currentColor().hex) : []);
  // 10 unique recent color history (only hex strings)
  colorHistory = signal<string[]>([]);

  colorPickerColor = '';
  colorPickerType: ColorType = ColorType.HEX;
  colorPickerOptions = [
    { label: 'HEX', value: ColorType.HEX },
    { label: 'RGB', value: ColorType.RGB },
    { label: 'HSV', value: ColorType.HSV },
    { label: 'HSL', value: ColorType.HSL },
  ];

  rgbInput = { r: 0, g: 0, b: 0 };
  hslInput = { h: 0, s: 0, l: 0 };
  hsvInput = { h: 0, s: 0, v: 0 };
  hexInput = '';
  isHexInputFocused = false;

  constructor(private messageService: MessageService) {
    // automatically sync inputs and pickers whenever currentColor changes
    effect(() => {
      const color = this.currentColor();
      if (!color.hex) return;

      this.colorPickerColor = color.hex.replace('#', '');
      if (!this.isHexInputFocused) {
        this.hexInput = color.hex.replace('#', '').toUpperCase();
      }

      const rgbMatch = color.rgb.match(/\d+/g);
      if (rgbMatch) this.rgbInput = { r: +rgbMatch[0], g: +rgbMatch[1], b: +rgbMatch[2] };

      const hslMatch = color.hsl.match(/\d+/g);
      if (hslMatch) this.hslInput = { h: +hslMatch[0], s: +hslMatch[1], l: +hslMatch[2] };

      const hsvMatch = color.hsv.match(/\d+/g);
      if (hsvMatch) this.hsvInput = { h: +hsvMatch[0], s: +hsvMatch[1], v: +hsvMatch[2] };
    });

    afterNextRender(() => {
      this.setColor();
    });
  }

  setColor(value?: string, type: ColorType = ColorType.HEX) {
    // if value is empty just get a random hex color
    const colorValue = value !== undefined ? value : this.getRandomHex();
    const newColorObj = this.createColorObject(colorValue, type);

    if (newColorObj) {
      this.currentColor.set(newColorObj);
      this.putHistory(newColorObj.hex);
    }
  }

  copyColorToClipboard(color: string) {
    navigator.clipboard.writeText(color).then(() => {
      this.messageService.add({ severity: 'success', summary: color, detail: 'Copied to clipboard' });
    }).catch(err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not copy color' });
      console.error('Could not copy color: ', err);
    });
  }

  putHistory(color: string) {
    this.colorHistory.update(history => {
      if (history.includes(color)) return history;
      return [color, ...history].slice(0, 10);
    });
  }

  onHexInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const processedValue = inputElement.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    if (processedValue !== inputElement.value) {
      inputElement.value = processedValue;
    }

    if (/^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(processedValue)) {
      this.hexInput = processedValue;
      this.setColor(processedValue, ColorType.HEX);
    }
  }

  onHexInputBlur() {
    this.isHexInputFocused = false;
    let cleanHex = this.hexInput.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
      this.hexInput = cleanHex;
    }
    if (/^[0-9A-F]{6}$/.test(cleanHex)) {
      this.setColor(cleanHex, ColorType.HEX);
    }
  }

  onRgbInputChange(field: 'r' | 'g' | 'b', event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value === '') return;

    const clampedValue = this.clamp(Number(input.value), 0, 255);
    if (Number(input.value) !== clampedValue) {
      input.value = clampedValue.toString();
    }

    this.rgbInput[field] = clampedValue;
    const { r, g, b } = this.rgbInput;
    this.setColor(`rgb(${r},${g},${b})`, ColorType.RGB);
  }

  onHslInputChange(field: 'h' | 's' | 'l', event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value === '') return;

    const max = field === 'h' ? 360 : 100;
    const clampedValue = this.clamp(Number(input.value), 0, max);
    if (Number(input.value) !== clampedValue) {
      input.value = clampedValue.toString();
    }

    this.hslInput[field] = clampedValue;
    const { h, s, l } = this.hslInput;
    this.setColor(`hsl(${h},${s}%,${l}%)`, ColorType.HSL);
  }

  onHsvInputChange(field: 'h' | 's' | 'v', event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value === '') return;

    const max = field === 'h' ? 360 : 100;
    const clampedValue = this.clamp(Number(input.value), 0, max);
    if (Number(input.value) !== clampedValue) {
      input.value = clampedValue.toString();
    }

    this.hsvInput[field] = clampedValue;
    const { h, s, v } = this.hsvInput;
    this.setColor(`hsv(${h},${s}%,${v}%)`, ColorType.HSV);
  }

  private clamp(value: number, min: number, max: number): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
  }

  private getRandomHex(): string {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    return `#${randomHex}`;
  }

  private generateShades(hex: string): Color[] {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const shades: Color[] = [];
    // percentages to mix with white (positive) and black (negative)
    const steps = [0.67, 0.33, -0.33, -0.67];

    for (const step of steps) {
      const newR = step < 0 ? Math.round(r * (1 + step)) : Math.round(r + (255 - r) * step);
      const newG = step < 0 ? Math.round(g * (1 + step)) : Math.round(g + (255 - g) * step);
      const newB = step < 0 ? Math.round(b * (1 + step)) : Math.round(b + (255 - b) * step);

      const newHex = this.rgbToHex(newR, newG, newB);
      const colorObj = this.createColorObject(newHex, ColorType.HEX);
      if (colorObj) shades.push(colorObj);
    }

    return shades;
  }

  private createColorObject(value: string, type: ColorType): Color | null {
    let r: number | null = null;
    let g: number | null = null;
    let b: number | null = null;

    switch (type) {
      case ColorType.HEX: {
        let cleanHex = value.replace('#', '');
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        if (cleanHex.length !== 6) return null;
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
        break;
      }
      case ColorType.RGB: {
        const match = value.match(/-?\d+(\.\d+)?/g);
        if (match && match.length >= 3) {
          r = this.clamp(parseFloat(match[0]), 0, 255);
          g = this.clamp(parseFloat(match[1]), 0, 255);
          b = this.clamp(parseFloat(match[2]), 0, 255);
        }
        break;
      }
      case ColorType.HSL: {
        const match = value.match(/-?\d+(\.\d+)?/g);
        if (match && match.length >= 3) {
          const h = this.clamp(parseFloat(match[0]), 0, 360);
          const s = this.clamp(parseFloat(match[1]), 0, 100);
          const l = this.clamp(parseFloat(match[2]), 0, 100);
          const rgb = this.hslToRgb(h, s, l);
          r = rgb.r; g = rgb.g; b = rgb.b;
        }
        break;
      }
      case ColorType.HSV: {
        const match = value.match(/-?\d+(\.\d+)?/g);
        if (match && match.length >= 3) {
          const h = this.clamp(parseFloat(match[0]), 0, 360);
          const s = this.clamp(parseFloat(match[1]), 0, 100);
          const v = this.clamp(parseFloat(match[2]), 0, 100);
          const rgb = this.hsvToRgb(h, s, v);
          r = rgb.r; g = rgb.g; b = rgb.b;
        }
        break;
      }
    }

    if (r === null || g === null || b === null || isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    return {
      hex: this.rgbToHex(r, g, b),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsv: this.rgbToHsv(r, g, b),
      hsl: this.rgbToHsl(r, g, b)
    };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  private hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4))
    };
  }

  private hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
    s /= 100;
    v /= 100;
    const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return {
      r: Math.round(f(5) * 255),
      g: Math.round(f(3) * 255),
      b: Math.round(f(1) * 255)
    };
  }

  private rgbToHsl(r: number, g: number, b: number): string {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  private rgbToHsv(r: number, g: number, b: number): string {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max, d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
  }
}