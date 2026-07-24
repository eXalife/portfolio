import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { LayoutService } from '../../../service/layout.service';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [NgIf, FormsModule, InputTextModule, InputSwitchModule, FloatLabelModule, CheckboxModule, SliderModule, InputNumberModule, ButtonModule, InputTextareaModule],
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
  passwordLength: number = 24;
  passwordLength$ = new Subject<number>();

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
    // subject for preventing too many calls to generatePassword when the slider is being dragged
    this.passwordLength$.pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed()).subscribe((value: number) => {
      this.passwordLength = value;
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

    if (this.passwordLength < this.minPasswordLength) {
      this.passwordLength = this.minPasswordLength;
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

    // twice the length of random numbers for selection and shuffling, first half for selection, second half for shuffling
    const randomValues = new Uint32Array(this.passwordLength * 2);
    window.crypto.getRandomValues(randomValues);

    const passwordArray: string[] = [];
    let randIdx = 0;

    // guarantee at least one character from each selected set
    for (const charSet of activeSets) {
      if (passwordArray.length >= this.passwordLength) break;
      passwordArray.push(charSet[randomValues[randIdx++] % charSet.length]);
    }

    // fill the remaining length with random characters from all active sets
    for (let i = passwordArray.length; i < this.passwordLength; i++) {
      passwordArray.push(characters[randomValues[randIdx++] % characters.length]);
    }

    // fisher-yates shuffle
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = randomValues[randIdx++] % (i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    this.password = passwordArray.join('');
  }

  copyPassword() {
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
      this.maxPasswordLength = 8192;
      this.messageService.add({ severity: 'success', summary: 'Easter Egg Unlocked!', detail: 'Max password length increased to 8192' });
      this.clickCount = 0;
    }
  }
}
