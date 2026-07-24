import { NgClass, NgIf } from '@angular/common';
import { Component, Renderer2, ViewEncapsulation } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../service/layout.service';
import { FooterComponent } from './footer/footer.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [TopbarComponent, SidebarComponent, FooterComponent, RouterOutlet, NgIf, NgClass, ToastModule, TooltipModule, ProgressSpinnerModule, BlockUIModule],
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LabComponent {
  loading = false;

  constructor(private layoutService: LayoutService, private renderer: Renderer2, private router: Router) {
    if (this.layoutService.isBrowser) {
      if (this.layoutService.state.staticMenuMobileActive) {
        this.blockBodyScroll();
      }
    }
  }

  blockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    }
    else {
      document.body.className += ' blocked-scroll';
    }
  }

  unblockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    }
    else {
      document.body.className = document.body.className.replace(new RegExp('(^|\\b)' +
        'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  get containerClass() {
    return {
      'layout-theme-light': this.layoutService.config().colorScheme === 'light',
      'layout-theme-dark': this.layoutService.config().colorScheme === 'dark',
      'layout-overlay': this.layoutService.config().menuMode === 'overlay',
      'layout-static': this.layoutService.config().menuMode === 'static',
      'layout-static-inactive': this.layoutService.state.staticMenuDesktopInactive && this.layoutService.config().menuMode === 'static',
      'layout-overlay-active': this.layoutService.state.overlayMenuActive,
      'layout-mobile-active': this.layoutService.state.staticMenuMobileActive,
      'p-input-filled': this.layoutService.config().inputStyle === 'filled',
      'p-ripple-disabled': !this.layoutService.config().ripple
    }
  }
}
