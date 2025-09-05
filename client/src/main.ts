import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { AppComponent } from '@app/pages/app/app.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { removeLeadingSlash } from '@src/utils/route/route.utils';
import { environment } from './environments/environment';


if (environment.production) {
    enableProdMode();
}


const routes: Routes = [
    { path: '', redirectTo: removeLeadingSlash(ROUTES.home), pathMatch: 'full' },

    {
        path: removeLeadingSlash(ROUTES.home),
        component: HomePageComponent,
    },
    //{ path: removeLeadingSlash(ROUTES.createGame), component: CreateGameComponent },
    //{ path: removeLeadingSlash(ROUTES.adminGame), component: AdminGameComponent }, 

    { path: '**', redirectTo: removeLeadingSlash(ROUTES.home) },
];

enableProfiling();
bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
