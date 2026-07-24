import { Component, computed, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SliderModule } from 'primeng/slider';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LayoutService } from '../../../service/layout.service';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [FormsModule, InputTextModule, InputSwitchModule, FloatLabelModule, CheckboxModule, SliderModule, InputNumberModule, ButtonModule, InputTextareaModule],
  templateUrl: './password-generator.component.html',
  styleUrl: './password-generator.component.scss'
})
export class PasswordGeneratorComponent implements OnInit {
  readonly uppercaseChars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  readonly lowercaseChars: string = 'abcdefghijklmnopqrstuvwxyz';
  readonly numberChars: string = '0123456789';
  readonly symbolChars: string = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  customChars: string = this.uppercaseChars + this.lowercaseChars + this.numberChars + this.symbolChars;

  password: string = '';
  passwordLength = signal<number>(24);

  passwordWidth = computed(() => {
    const length = this.passwordLength();
    return length <= 0 ? 0 : Math.floor(Math.log10(length)) + 1;
  });

  includeUppercase: boolean = true;
  includeLowercase: boolean = true;
  includeNumbers: boolean = true;
  includeSymbols: boolean = true;
  customize: boolean = false;

  minPasswordLength: number = 4;
  maxPasswordLength: number = 256;

  private clickCount: number = 0;
  private clickTimeout: any;

  constructor(private layoutService: LayoutService, private messageService: MessageService) {
    // observe for preventing too many calls to generatePassword when the slider is being dragged
    toObservable(this.passwordLength).pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed()).subscribe((value: number) => {
      this.passwordLength.set(value);
      this.generatePassword();
    });
  }

  ngOnInit() {
    if (this.layoutService.isBrowser) {
      this.generatePassword();
    }
  }

  customizeChars() {
    if (this.customize) {
      this.includeUppercase = false;
      this.includeLowercase = false;
      this.includeNumbers = false;
      this.includeSymbols = false;
    } else {
      this.customChars = this.uppercaseChars + this.lowercaseChars + this.numberChars + this.symbolChars;
      this.includeUppercase = true;
      this.includeLowercase = true;
      this.includeNumbers = true;
      this.includeSymbols = true;
    }
    this.generatePassword();
  }

  generatePassword() {
    if (!this.layoutService.isBrowser) return;

    let currentLength = this.passwordLength();
    if (currentLength < this.minPasswordLength) {
      this.passwordLength.set(this.minPasswordLength);
      currentLength = this.minPasswordLength;
    } else if (currentLength > this.maxPasswordLength) {
      this.passwordLength.set(this.maxPasswordLength);
      currentLength = this.maxPasswordLength;
    }

    const activeSets: string[] = [];
    if (this.includeUppercase) activeSets.push(this.uppercaseChars);
    if (this.includeLowercase) activeSets.push(this.lowercaseChars);
    if (this.includeNumbers) activeSets.push(this.numberChars);
    if (this.includeSymbols) activeSets.push(this.symbolChars);
    if (this.customize && this.customChars) {
      // remove duplicate characters from customChars
      const uniqueChars = Array.from(new Set(this.customChars)).join('');
      activeSets.push(uniqueChars);
      if (uniqueChars.length !== this.customChars.length) {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Duplicate characters removed from custom characters' });
      }
      setTimeout(() => {
        this.customChars = uniqueChars;
      });
    }

    const characters = activeSets.join('');
    if (!characters) {
      this.password = '';
      return;
    }

    const passwordArray: string[] = [];

    // guarantee at least one character from each selected set
    for (const charSet of activeSets) {
      if (passwordArray.length >= currentLength) break;
      const randomIndex = this.getSecureRandomIndex(charSet.length);
      passwordArray.push(charSet[randomIndex]);
    }

    // fill the remaining length with random characters from all active sets
    while (passwordArray.length < currentLength) {
      const safeIndex = this.getSecureRandomIndex(characters.length);
      passwordArray.push(characters[safeIndex]);
    }

    this.shuffleArray(passwordArray);

    this.password = passwordArray.join('');
  }

  // generates a cryptographically secure random index with zero modulo bias.
  private getSecureRandomIndex(max: number): number {
    if (max <= 0) return 0;
    const randomBuffer = new Uint32Array(1);
    const MAX_UINT32 = 4294967296; // total count of possible values
    const limit = MAX_UINT32 - (MAX_UINT32 % max);

    let randomValue: number;
    do {
      window.crypto.getRandomValues(randomBuffer);
      randomValue = randomBuffer[0];
    } while (randomValue >= limit);

    return randomValue % max;
  }

  // fisher-yates shuffle
  private shuffleArray(passwordArray: string[]): void {
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = this.getSecureRandomIndex(i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
  }

  copyPasswordToClipboard() {
    navigator.clipboard.writeText(this.password).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password copied to clipboard' });
    }).catch(err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not copy password' });
      console.error('Could not copy password: ', err);
    });
  }

  unlockEasterEgg() {
    this.clickCount++;
    if (this.clickTimeout) clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => this.clickCount = 0, 1000);
    if (this.clickCount === 8) {
      this.maxPasswordLength = 16384;
      this.messageService.add({ severity: 'contrast', summary: 'Easter Egg Unlocked!', detail: 'Max password length increased to 16384' });
      this.clickCount = 0;
    }
  }
}
