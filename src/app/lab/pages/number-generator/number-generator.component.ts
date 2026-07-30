import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-number-generator',
  standalone: true,
  imports: [FormsModule, InputTextModule, FloatLabelModule, ButtonModule, DecimalPipe, FieldsetModule],
  templateUrl: './number-generator.component.html',
  styleUrl: './number-generator.component.scss'
})
export class NumberGeneratorComponent {
  private readonly belowTwenty = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  private readonly tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  private readonly scales = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion'];
  private readonly BigUint64Range = 18446744073709551616n;

  readonly minSafe = Number.MIN_SAFE_INTEGER;
  readonly maxSafe = Number.MAX_SAFE_INTEGER;

  messageService: MessageService = inject(MessageService);

  randomNumber = signal<number | null>(null);

  minInput = '1';
  maxInput = '100';

  generateNumber() {
    try {
      const minBig = this.sanitizeToBigInt(this.minInput);
      const maxBig = this.sanitizeToBigInt(this.maxInput);

      if (minBig > maxBig) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Min value cannot be greater than Max value.' });
        this.randomNumber.set(null);
        return;
      }

      if (minBig < BigInt(this.minSafe) || maxBig > BigInt(this.maxSafe)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Values must be between ${this.minSafe} and ${this.maxSafe}.` });
        this.randomNumber.set(null);
        return;
      }

      const result = this.getSecureSafeInt(Number(minBig), Number(maxBig));
      this.randomNumber.set(result);

    } catch (error) {
      // Catches invalid inputs (like empty fields, standalone '-', or parse failures)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter valid integer numbers.' });
      this.randomNumber.set(null);
    }
  }

  allowOnlyNumbers(field: 'min' | 'max', event: Event) {
    const input = event.target as HTMLInputElement;

    // Allow digits (0-9) and minus sign '-'
    const sanitizedNumber = input.value.replace(/(?!^-)[^0-9]/g, '');
    input.value = sanitizedNumber;

    if (field === 'min') this.minInput = input.value;
    else if (field === 'max') this.maxInput = input.value;
  }

  numberToWords(num: number | null): string {
    if (num == null) return '';
    if (num === 0) return 'zero';
    if (num < 0) return 'minus ' + this.numberToWords(-num);

    let wordResult = '';
    let groupIndex = 0;
    let temp = num;

    const convertChunk = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return this.belowTwenty[n] + ' ';
      if (n < 100) return this.tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + this.belowTwenty[n % 10] : '') + ' ';
      return this.belowTwenty[Math.floor(n / 100)] + ' hundred ' + convertChunk(n % 100);
    };

    while (temp > 0) {
      const chunk = temp % 1000;
      if (chunk !== 0) {
        wordResult = convertChunk(chunk) + this.scales[groupIndex] + ' ' + wordResult;
      }
      temp = Math.floor(temp / 1000);
      groupIndex++;
    }

    return wordResult.trim();
  }

  reset() {
    this.randomNumber.set(null);
    this.minInput = '1';
    this.maxInput = '100';
  }

  private sanitizeToBigInt(value: string): bigint {
    if (!value) throw new Error('Empty input');

    let cleanStr = value.replace(/[,_ ]/g, '').trim();

    if (cleanStr.includes('.')) {
      cleanStr = cleanStr.split('.')[0];
    }

    if (!cleanStr || cleanStr === '-') throw new Error('Invalid number format');

    return BigInt(cleanStr);
  }

  private getSecureSafeInt(min: number, max: number): number {
    const range = BigInt(max) - BigInt(min) + 1n;
    const limit = this.BigUint64Range - (this.BigUint64Range % range);
    const array = new BigUint64Array(1);

    let randomValue: bigint;
    do {
      // reject biased values
      crypto.getRandomValues(array);
      randomValue = array[0];
    } while (randomValue >= limit);

    const resultBigInt = BigInt(min) + (randomValue % range);
    // safe to cast back to Number because the result is between MIN_SAFE_INTEGER and MAX_SAFE_INTEGER.
    return Number(resultBigInt);
  }
}
