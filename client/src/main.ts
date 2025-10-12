import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
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
    { path: '', redirectTo: removeLeadingSlash(ROUTES.homePage), pathMatch: 'full' },

    {
        path: removeLeadingSlash(ROUTES.homePage),
        component: HomePageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.editorPage) + '/:id',
        component: EditorPageComponent,
    },
    { path: removeLeadingSlash(ROUTES.managementPage), component: ManagementPageComponent },
    {
        path: removeLeadingSlash(ROUTES.sessionCreationPage),
        component: SessionCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.characterCreationPage),
        component: CharacterCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.waitingRoomPage),
        component: WaitingRoomPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.gameSessionPage),
        component: GameSessionPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.parametersPage),
        component: ParametersPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.joinSessionPage),
        component: JoinSessionPageComponent,
    },
    { path: '**', redirectTo: removeLeadingSlash(ROUTES.homePage) },
];

enableProfiling();
bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
