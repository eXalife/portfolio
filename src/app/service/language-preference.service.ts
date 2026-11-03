import { ApplicationRef, DestroyRef, inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';

import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { filter, take } from 'rxjs';

export const APP_LANGUAGES = ['en', 'tr'] as const;

export type AppLanguage = typeof APP_LANGUAGES[number];

const LANGUAGE_STORAGE_KEY = 'preferred-language';

function isSupportedLanguage(
  lang: string | null
): lang is AppLanguage {
  return lang === 'en' || lang === 'tr';
}

@Injectable({
  providedIn: 'root'
})
export class LanguagePreferenceService {

  private readonly transloco = inject(TranslocoService);
  private readonly appRef = inject(ApplicationRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.appRef.isStable
      .pipe(
        filter(stable => stable),
        take(1)
      )
      .subscribe(() => {
        this.zone.run(() => {
          const savedLang = this.getSavedLanguage();

          if (isSupportedLanguage(savedLang)) {
            this.transloco.setActiveLang(savedLang);
          }

          this.transloco.langChanges$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(lang => {
              this.saveLanguage(lang);
            });
        });
      });
  }

  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveLanguage(lang: string): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch { }
  }
}