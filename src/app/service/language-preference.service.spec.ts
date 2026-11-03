
import { ApplicationRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';

import { LanguagePreferenceService } from './language-preference.service';

describe('LanguagePreferenceService', () => {
  const STORAGE_KEY = 'preferred-language';

  let stable$: Subject<boolean>;
  let langChanges$: Subject<string>;

  let translocoMock: {
    setActiveLang: jasmine.Spy;
    langChanges$: Subject<string>;
  };

  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();

    stable$ = new Subject<boolean>();
    langChanges$ = new Subject<string>();

    translocoMock = {
      setActiveLang: jasmine.createSpy('setActiveLang'),
      langChanges$
    };

    getItemSpy = spyOn(Storage.prototype, 'getItem').and.callThrough();
    setItemSpy = spyOn(Storage.prototype, 'setItem').and.callThrough();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  function createService(
    platformId: string = 'browser'
  ): LanguagePreferenceService {
    TestBed.configureTestingModule({
      providers: [
        LanguagePreferenceService,
        {
          provide: TranslocoService,
          useValue: translocoMock
        },
        {
          provide: ApplicationRef,
          useValue: {
            isStable: stable$.asObservable(),
            tick: jasmine.createSpy('tick')
          }
        },
        {
          provide: PLATFORM_ID,
          useValue: platformId
        }
      ]
    });

    return TestBed.inject(LanguagePreferenceService);
  }

  it('should be created', () => {
    const service = createService();

    expect(service).toBeTruthy();
  });

  it('should wait until the application becomes stable', () => {
    createService();

    stable$.next(false);

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(translocoMock.setActiveLang).not.toHaveBeenCalled();

    stable$.next(true);

    expect(getItemSpy).toHaveBeenCalledOnceWith(STORAGE_KEY);
  });

  it('should restore the saved English language', () => {
    getItemSpy.and.returnValue('en');

    createService();
    stable$.next(true);

    expect(translocoMock.setActiveLang).toHaveBeenCalledOnceWith('en');
  });

  it('should restore the saved Turkish language', () => {
    getItemSpy.and.returnValue('tr');

    createService();
    stable$.next(true);

    expect(translocoMock.setActiveLang).toHaveBeenCalledOnceWith('tr');
  });

  [null, 'fr', 'EN', 'de', ''].forEach(lang => {
    it(`should not restore unsupported language "${lang}"`, () => {
      getItemSpy.and.returnValue(lang);

      createService();
      stable$.next(true);

      expect(translocoMock.setActiveLang).not.toHaveBeenCalled();
    });
  });

  it('should subscribe to language changes only after the application becomes stable', () => {
    createService();

    langChanges$.next('tr');

    expect(setItemSpy).not.toHaveBeenCalled();

    stable$.next(true);
    langChanges$.next('tr');

    expect(setItemSpy).toHaveBeenCalledOnceWith(STORAGE_KEY, 'tr');
  });

  it('should persist language changes', () => {
    createService();
    stable$.next(true);

    langChanges$.next('en');
    langChanges$.next('tr');

    expect(setItemSpy).toHaveBeenCalledTimes(2);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'en');
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'tr');
  });

  it('should initialize only once when the application becomes stable', () => {
    getItemSpy.and.returnValue('en');

    createService();

    stable$.next(true);
    stable$.next(true);

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(translocoMock.setActiveLang).toHaveBeenCalledTimes(1);
  });

  it('should handle localStorage.getItem errors gracefully', () => {
    getItemSpy.and.throwError('Storage unavailable');

    createService();

    expect(() => stable$.next(true)).not.toThrow();
    expect(translocoMock.setActiveLang).not.toHaveBeenCalled();

    langChanges$.next('tr');

    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'tr');
  });

  it('should handle localStorage.setItem errors gracefully', () => {
    setItemSpy.and.throwError('Storage unavailable');

    createService();
    stable$.next(true);

    expect(() => langChanges$.next('tr')).not.toThrow();
  });

  it('should not initialize on the server', () => {
    createService('server');

    stable$.next(true);
    langChanges$.next('tr');

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(translocoMock.setActiveLang).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should unsubscribe from language changes when destroyed', () => {
    createService();
    stable$.next(true);

    TestBed.resetTestingModule();

    langChanges$.next('tr');

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
