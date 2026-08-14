import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, effect, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface AppConfig {
    inputStyle: string;
    colorScheme: string;
    theme: string;
    ripple: boolean;
    menuMode: string;
    scale: number;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    profileSidebarVisible: boolean;
    configSidebarVisible: boolean;
    staticMenuMobileActive: boolean;
    menuHoverActive: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class LayoutService {
    isBrowser!: boolean;

    private _config: AppConfig = {
        ripple: true,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'dark',
        theme: 'md-dark-indigo',
        scale: 14,
    };

    config = signal<AppConfig>(this._config);
    loading = signal<boolean>(false);
    themeLink = signal<string>('assets/primeng-themes/md-light-indigo/theme.css');

    state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
    };

    private configUpdate = new Subject<AppConfig>();
    configUpdate$ = this.configUpdate.asObservable();
    private overlayOpen = new Subject<any>();
    overlayOpen$ = this.overlayOpen.asObservable();

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);

        effect(() => {
            const config = this.config();
            if (this.updateStyle(config)) {
                this.changeTheme();
            }
            this.onConfigUpdate();
        });

        if (this.isBrowser) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const themeFromStorage = localStorage.getItem('theme');
            if ((!themeFromStorage && !prefersDark) || themeFromStorage === 'light') {
                this.config.update((config) => ({
                    ...config,
                    theme: 'md-light-indigo',
                    colorScheme: 'light'
                }));
                this.themeLink.set('assets/primeng-themes/md-light-indigo/theme.css');
            } else if ((!themeFromStorage && prefersDark) || themeFromStorage === 'dark') {
                this.config.update((config) => ({
                    ...config,
                    theme: 'md-dark-indigo',
                    colorScheme: 'dark'
                }));
                this.themeLink.set('assets/primeng-themes/md-dark-indigo/theme.css');
            }
        }
    }

    updateStyle(config: AppConfig) {
        return (
            config.theme !== this._config.theme ||
            config.colorScheme !== this._config.colorScheme
        );
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.state.overlayMenuActive = !this.state.overlayMenuActive;
            if (this.state.overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.state.staticMenuDesktopInactive =
                !this.state.staticMenuDesktopInactive;
        } else {
            this.state.staticMenuMobileActive =
                !this.state.staticMenuMobileActive;

            if (this.state.staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    showProfileSidebar() {
        this.state.profileSidebarVisible = !this.state.profileSidebarVisible;
        if (this.state.profileSidebarVisible) {
            this.overlayOpen.next(null);
        }
    }

    showConfigSidebar() {
        this.state.configSidebarVisible = true;
    }

    isOverlay() {
        return this.config().menuMode === 'overlay';
    }

    isDesktop() {
        return window.innerWidth > 1199;
    }

    isMobile() {
        return !this.isDesktop();
    }

    isDarkTheme() {
        return this._config.colorScheme === 'dark';
    }

    onConfigUpdate() {
        this._config = { ...this.config() };
        this.configUpdate.next(this.config());
    }

    changeTheme() {
        const config = this.config();
        const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
        const themeLinkHref = themeLink.getAttribute('href')!;
        const newHref = themeLinkHref
            .split('/')
            .map((el) =>
                el == this._config.theme
                    ? (el = config.theme)
                    : el == `theme-${this._config.colorScheme}`
                        ? (el = `theme-${config.colorScheme}`)
                        : el
            )
            .join('/');
        this.replaceThemeLink(newHref);
    }

    replaceThemeLink(href: string) {
        const themeLink = document.getElementById('theme-css') as HTMLLinkElement;

        if (themeLink) {
            themeLink.setAttribute('href', href);
        }
    }
}
