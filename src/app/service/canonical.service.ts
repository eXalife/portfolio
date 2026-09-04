import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CanonicalService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly baseUrl = 'https://cemtemucin.com';

  init(): void {
    this.setCanonicalUrl(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.setCanonicalUrl(event.urlAfterRedirects);
      });
  }

  private setCanonicalUrl(url: string): void {
    const cleanPath = url.split('?')[0].split('#')[0];
    const canonicalUrl = `${this.baseUrl}${cleanPath === '/' ? '' : cleanPath}`;

    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', canonicalUrl);
  }
}