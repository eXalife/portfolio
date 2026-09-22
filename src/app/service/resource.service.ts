import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  constructor(@Inject(DOCUMENT) private document: Document) { }

  addPreload(href: string, as: string, type?: string, media?: string): void {
    this.addResourceHint('preload', href, as, type, media);
  }

  addPrefetch(href: string, as: string, type?: string, media?: string): void {
    this.addResourceHint('prefetch', href, as, type, media);
  }

  private addResourceHint(rel: 'preload' | 'prefetch', href: string, as: string, type?: string, media?: string): void {
    const existingLink = this.document.head.querySelector(`link[rel="${rel}"][href="${href}"]`);

    if (!existingLink) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      link.setAttribute('as', as);
      link.setAttribute('href', href);

      if (type) {
        link.setAttribute('type', type);
      }

      if (media) {
        link.setAttribute('media', media);
      }

      if (as === 'font') {
        link.setAttribute('crossorigin', '');
      }

      this.document.head.appendChild(link);
    }
  }
}