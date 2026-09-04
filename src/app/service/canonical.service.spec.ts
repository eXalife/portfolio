import { TestBed } from '@angular/core/testing';
import { CanonicalService } from './canonical.service';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';

describe('CanonicalService', () => {
  let service: CanonicalService;
  let mockRouter: any;
  let routerEventsSubject: Subject<any>;
  let document: Document;

  beforeEach(() => {
    routerEventsSubject = new Subject<any>();
    mockRouter = {
      url: '/',
      events: routerEventsSubject.asObservable()
    };

    TestBed.configureTestingModule({
      providers: [
        CanonicalService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(CanonicalService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Cleanup any added links to prevent test bleed
    const links = document.querySelectorAll('link[rel="canonical"]');
    links.forEach(link => link.remove());
  });

  it('should set initial canonical URL on init based on router.url', () => {
    mockRouter.url = '/about';
    service.init();

    const link = document.querySelector('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://cemtemucin.com/about');
  });

  it('should omit trailing slash for root URL on init', () => {
    mockRouter.url = '/';
    service.init();

    const link = document.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe('https://cemtemucin.com');
  });

  it('should strip query parameters and fragments from URL', () => {
    mockRouter.url = '/contact?ref=google#form';
    service.init();

    const link = document.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe('https://cemtemucin.com/contact');
  });

  it('should update canonical URL on NavigationEnd event', () => {
    service.init(); // Setup initial state

    // Simulate navigation end
    routerEventsSubject.next(new NavigationEnd(1, '/projects?page=2', '/projects?page=2'));

    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1); // Should not create duplicates
    expect(links[0].getAttribute('href')).toBe('https://cemtemucin.com/projects');
  });

  it('should ignore other router events', () => {
    service.init(); // URL initially /

    // Fire a non-NavigationEnd event like NavigationStart
    routerEventsSubject.next(new NavigationStart(1, '/should-ignore'));

    const link = document.querySelector('link[rel="canonical"]');
    // Should still be the initial value
    expect(link?.getAttribute('href')).toBe('https://cemtemucin.com');
  });
});