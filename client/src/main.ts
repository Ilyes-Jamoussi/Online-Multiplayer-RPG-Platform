import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ROUTES } from '@common/enums/routes.enum';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterCreationPageComponent } from '@app/pages/character-creation-page/character-creation-page.component';
import { EditorPageComponent } from '@app/pages/editor-page/editor-page.component';
import { GameSessionPageComponent } from '@app/pages/game-session-page/game-session-page.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { JoinSessionPageComponent } from '@app/pages/join-session-page/join-session-page.component';
import { ManagementPageComponent } from '@app/pages/management-page/management-page.component';
import { ParametersPageComponent } from '@app/pages/parameters-page/parameters-page.component';
import { SessionCreationPageComponent } from '@app/pages/session-creation-page/session-creation-page.component';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { removeLeadingSlash } from '@src/utils/route/route.util';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: removeLeadingSlash(ROUTES.HomePage), pathMatch: 'full' },

    {
        path: removeLeadingSlash(ROUTES.HomePage),
        component: HomePageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.EditorPage) + '/:id',
        component: EditorPageComponent,
    },
    { path: removeLeadingSlash(ROUTES.ManagementPage), component: ManagementPageComponent },
    {
        path: removeLeadingSlash(ROUTES.SessionCreationPage),
        component: SessionCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.CharacterCreationPage),
        component: CharacterCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.WaitingRoomPage),
        component: WaitingRoomPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.GameSessionPage),
        component: GameSessionPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.ParametersPage),
        component: ParametersPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.JoinSessionPage),
        component: JoinSessionPageComponent,
    },
    { path: '**', redirectTo: removeLeadingSlash(ROUTES.HomePage) },
];

enableProfiling();
bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
