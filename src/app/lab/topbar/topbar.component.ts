import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MenuModule } from 'primeng/menu';
import { distinctUntilChanged } from 'rxjs';
import { LayoutService } from '../service/layout.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgClass, InputSwitchModule, FormsModule, MenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {

  themeSwitch!: string;

  items: MenuItem[] = [
    {
      items: [
        {
          separator: true
        },
        // {
        //   label: 'Sign Out', icon: 'pi pi-fw pi-sign-out', command: () => this.signOut()
        // },
      ]
    }
  ];

  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
  @ViewChild('topbarmenu') menu!: ElementRef;

  constructor(public layoutService: LayoutService) {
    if (layoutService.isBrowser) {
    }
  }

  ngOnInit(): void {
    this.themeSwitch = this.layoutService.config().colorScheme;
    this.layoutService.configUpdate$.pipe(distinctUntilChanged()).subscribe(config => this.themeSwitch = config.colorScheme);
  }

  triggerChangeTheme() {
    if (this.themeSwitch != null) {
      localStorage.setItem('theme', this.themeSwitch);
      if (this.themeSwitch === 'light')
        this.changeTheme('md-light-indigo', 'light');
      else if (this.themeSwitch === 'dark')
        this.changeTheme('md-dark-indigo', 'dark');
    }
  }

  changeTheme(theme: string, colorScheme: string) {
    this.layoutService.config.update((config) => ({
      ...config,
      theme,
      colorScheme
    }));
  }
}