import { animate, state, style, transition, trigger } from '@angular/animations';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter, Subscription } from 'rxjs';
import { LayoutService } from '../service/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, RouterLinkActive, NgTemplateOutlet],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  animations: [
    trigger('children', [
      state('collapsed', style({ height: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('collapsed <=> expanded', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  model: MenuItem[] = [];
  activeItems = new Set<MenuItem>();
  routerSubscription!: Subscription;

  constructor(public layoutService: LayoutService, public el: ElementRef, public router: Router) { }

  ngOnInit() {
    this.model = [{
      label: 'Pages',
      items: [
        { label: 'Weather Forecast', icon: 'pi pi-fw pi-cloud', routerLink: ['weather-forecast'] },
        {
          label: 'Generators', icon: 'pi-fw pi pi-chevron-right', items: [
            { label: 'Password Generator', icon: 'pi-fw pi pi-key', routerLink: ['password-generator'] },
            { label: 'Color Generator', icon: 'pi-fw pi pi-palette', routerLink: ['color-generator'] },
            { label: 'Number Generator', icon: 'pi-fw pi pi-asterisk', routerLink: ['number-generator'] }
          ]
        }
      ]
    }];

    this.checkActiveRoute(this.model);
    this.routerSubscription = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.checkActiveRoute(this.model));
  }

  private checkActiveRoute(items: MenuItem[]): boolean {
    return items.reduce((isActive, item) => {
      const match = !!item.routerLink && this.router.url.includes(`/${item.routerLink[0]}`.replace('//', '/'));
      const childActive = !!item.items && this.checkActiveRoute(item.items);

      if (match || childActive || item.expanded) this.activeItems.add(item);

      return isActive || match || childActive;
    }, false);
  }

  getSubmenuAnimation(item: MenuItem, isRoot: boolean): string {
    return isRoot || this.activeItems.has(item) ? 'expanded' : 'collapsed';
  }

  itemClick(event: Event, item: MenuItem) {
    if (item.disabled) return event.preventDefault();
    if (item.command) item.command({ originalEvent: event, item });

    if (item.items) {
      event.preventDefault();
      event.stopPropagation();
      this.activeItems.has(item) ? this.activeItems.delete(item) : this.activeItems.add(item);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Enter' || event.code === 'Space') {
      (<HTMLDivElement>event.target).click();
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }
}