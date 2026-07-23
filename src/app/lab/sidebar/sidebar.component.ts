import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { LayoutService } from '../../service/layout.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  model: any[] = [];

  constructor(public layoutService: LayoutService, public el: ElementRef) { }

  ngOnInit() {
    this.model = [
      {
        items: [
          { label: 'Password Generator', icon: 'pi pi-fw pi-key', routerLink: ['password-generator'] }
        ]
      }
    ];
  }

  onKeydown(event: KeyboardEvent) {
    const nodeElement = (<HTMLDivElement>event.target);
    if (event.code === 'Enter' || event.code === 'Space') {
      nodeElement.click();
      event.preventDefault();
    }
  }

  itemClick(event: Event) {
    event.stopPropagation();
  }
}
