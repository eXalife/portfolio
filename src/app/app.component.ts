import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CanonicalService } from './service/canonical.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private canonicalService = inject(CanonicalService);

  ngOnInit(): void {
    this.canonicalService.init();
  }
}
