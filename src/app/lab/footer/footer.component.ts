import { Component } from '@angular/core';
import { LayoutService } from '../service/layout.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(public layoutService: LayoutService) { }
}
