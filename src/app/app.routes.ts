import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./main/main.component').then(m => m.MainComponent),
        title: 'Cem Temuçin'
    },
    {
        path: 'lab',
        loadComponent: () => import('./lab/lab.component').then(m => m.LabComponent),
        title: 'Cem Temuçin | LAB',
        children: [
            { path: '', redirectTo: 'weather-forecast', pathMatch: 'full' },
            { path: 'weather-forecast', loadComponent: () => import('./lab/pages/weather-forecast/weather-forecast.component').then(m => m.WeatherForecastComponent), title: 'Cem Temuçin | Weather Forecast' },
            { path: 'password-generator', loadComponent: () => import('./lab/pages/password-generator/password-generator.component').then(m => m.PasswordGeneratorComponent), title: 'Cem Temuçin | Password Generator' },
            { path: 'color-generator', loadComponent: () => import('./lab/pages/color-generator/color-generator.component').then(m => m.ColorGeneratorComponent), title: 'Cem Temuçin | Color Generator' },
            { path: 'number-generator', loadComponent: () => import('./lab/pages/number-generator/number-generator.component').then(m => m.NumberGeneratorComponent), title: 'Cem Temuçin | Number Generator' },
        ]
    }
];
