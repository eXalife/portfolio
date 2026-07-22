import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
    { path: '', component: MainComponent },
    {
        path: 'lab',
        loadComponent: () => import('./lab/lab.component').then(m => m.LabComponent),
        children: [
            { path: '', redirectTo: 'password-generator', pathMatch: 'full' },
            { path: 'password-generator', loadComponent: () => import('./lab/password-generator/password-generator.component').then(m => m.PasswordGeneratorComponent) }
        ]
    }
];
