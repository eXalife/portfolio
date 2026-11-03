import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';
import en from '../assets/i18n/en.json';
import tr from '../assets/i18n/tr.json';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
    return TranslocoTestingModule.forRoot({
        langs: { en, tr },
        translocoConfig: {
            availableLangs: ['en', 'tr'],
            defaultLang: 'en',
        },
        preloadLangs: true,
        ...options,
    });
}