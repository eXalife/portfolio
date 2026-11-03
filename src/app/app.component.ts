import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CanonicalService } from './service/canonical.service';
import { LanguagePreferenceService } from './service/language-preference.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private canonicalService = inject(CanonicalService);

  constructor() {
    inject(LanguagePreferenceService);
    this.canonicalService.init();
  }
}
