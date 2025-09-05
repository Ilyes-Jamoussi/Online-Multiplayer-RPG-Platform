import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { AppComponent } from '@app/pages/app/app.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/game-creation-component/game-creation-component.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { removeLeadingSlash } from '@src/utils/route/route.utils';
import { AdminPageComponent } from './app/pages/admin-page/admin-page.component';
import { environment } from './environments/environment';

// import { CreateGameComponent } from './app/pages/create-game/create-game.component'; --- IGNORE ---

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: removeLeadingSlash(ROUTES.home), pathMatch: 'full' },
    {
        path: removeLeadingSlash(ROUTES.home),
        component: HomePageComponent,
    },
    { path: removeLeadingSlash(ROUTES.createGamePage), component: CreateGamePageComponent },
    { path: removeLeadingSlash(ROUTES.adminPage), component: AdminPageComponent },
    { path: '**', redirectTo: removeLeadingSlash(ROUTES.home) },
];

enableProfiling();
bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
