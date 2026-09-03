import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../service/layout.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TooltipModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(public layoutService: LayoutService) { }
}
