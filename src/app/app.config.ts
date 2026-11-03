import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { httpTimingInterceptor } from './interceptor/http-timing.interceptor';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTitleStrategy } from './transloco-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([httpTimingInterceptor])),
    provideClientHydration(),
    provideAnimationsAsync(),
    MessageService,
    ConfirmationService,
    provideTitleStrategy(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'tr'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader
    })
  ]
};
