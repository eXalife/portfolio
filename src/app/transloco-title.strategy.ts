import { Injectable, Provider, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

@Injectable()
export class TranslocoTitleStrategy extends TitleStrategy {
    private readonly title = inject(Title);
    private readonly transloco = inject(TranslocoService);
    private subscription?: Subscription;

    override updateTitle(snapshot: RouterStateSnapshot): void {
        const routeTitle = this.buildTitle(snapshot) ?? '';
        this.subscription?.unsubscribe();

        const keyStart = routeTitle.indexOf('sidebar.');

        if (keyStart === -1) {
            this.title.setTitle(routeTitle);
            return;
        }

        const prefix = routeTitle.slice(0, keyStart);
        const key = routeTitle.slice(keyStart);

        this.subscription = this.transloco.selectTranslate(key).subscribe(label => {
            this.title.setTitle(prefix + label);
        });
    }
}

export function provideTitleStrategy(): Provider {
    return {
        provide: TitleStrategy,
        useClass: TranslocoTitleStrategy
    };
}