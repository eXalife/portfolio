import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ResourceService } from './resource.service';

describe('ResourceService', () => {
  let service: ResourceService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourceService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    const links = document.head.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
    links.forEach(link => link.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a preload link to the document head', () => {
    const href = 'styles.css';
    const as = 'style';

    service.addPreload(href, as);

    const link = document.head.querySelector(`link[rel="preload"][href="${href}"]`);
    expect(link).toBeTruthy();
    expect(link?.getAttribute('as')).toBe(as);
    expect(link?.getAttribute('type')).toBeNull();
    expect(link?.hasAttribute('crossorigin')).toBeFalse();
  });

  it('should add a prefetch link to the document head', () => {
    const href = 'theme-dark.css';
    const as = 'style';

    service.addPrefetch(href, as);

    const link = document.head.querySelector(`link[rel="prefetch"][href="${href}"]`);
    expect(link).toBeTruthy();
    expect(link?.getAttribute('as')).toBe(as);
  });

  it('should not add a duplicate preload link if one already exists with the same href', () => {
    const href = 'main.js';
    const as = 'script';

    service.addPreload(href, as);
    service.addPreload(href, as);

    const links = document.head.querySelectorAll(`link[rel="preload"][href="${href}"]`);
    expect(links.length).toBe(1);
  });

  it('should not add a duplicate prefetch link if one already exists with the same href', () => {
    const href = 'theme-dark.css';
    const as = 'style';

    service.addPrefetch(href, as);
    service.addPrefetch(href, as);

    const links = document.head.querySelectorAll(`link[rel="prefetch"][href="${href}"]`);
    expect(links.length).toBe(1);
  });

  it('should set the type attribute if provided', () => {
    const href = 'hero.webp';
    const as = 'image';
    const type = 'image/webp';

    service.addPreload(href, as, type);

    const link = document.head.querySelector(`link[rel="preload"][href="${href}"]`);
    expect(link?.getAttribute('type')).toBe(type);
  });

  it('should add an empty crossorigin attribute if "as" is "font"', () => {
    const href = 'custom-font.woff2';
    const as = 'font';
    const type = 'font/woff2';

    service.addPreload(href, as, type);

    const link = document.head.querySelector(`link[rel="preload"][href="${href}"]`);
    expect(link?.hasAttribute('crossorigin')).toBeTrue();
    expect(link?.getAttribute('crossorigin')).toBe('');
  });
});