import { Routes } from '@angular/router';

const title = 'Cem Temuçin';
const labTitle = title + ' | LAB';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./main/main.component').then(m => m.MainComponent),
        title: title
    },
    {
        path: 'lab',
        loadComponent: () => import('./lab/lab.component').then(m => m.LabComponent),
        title: labTitle,
        children: [
            { path: '', redirectTo: 'weather-forecast', pathMatch: 'full' },
            { path: 'weather-forecast', loadComponent: () => import('./lab/pages/weather-forecast/weather-forecast.component').then(m => m.WeatherForecastComponent), title: labTitle + ' | Weather Forecast' },
            { path: 'threejs-viewer', loadComponent: () => import('./lab/pages/three-js-viewer/three-js-viewer.component').then(m => m.ThreeJsViewerComponent), title: labTitle + ' | Three.js Viewer' },
            { path: 'password-generator', loadComponent: () => import('./lab/pages/password-generator/password-generator.component').then(m => m.PasswordGeneratorComponent), title: labTitle + ' | Password Generator' },
            { path: 'color-generator', loadComponent: () => import('./lab/pages/color-generator/color-generator.component').then(m => m.ColorGeneratorComponent), title: labTitle + ' | Color Generator' },
            { path: 'number-generator', loadComponent: () => import('./lab/pages/number-generator/number-generator.component').then(m => m.NumberGeneratorComponent), title: labTitle + ' | Number Generator' },
        ]
    }
];
