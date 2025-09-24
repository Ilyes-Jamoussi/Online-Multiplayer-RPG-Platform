import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, enableProfiling } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterCreationPageComponent } from '@app/pages/character-creation-page/character-creation-page.component';
import { GameEditorPageComponent } from '@app/pages/game-editor-page/game-editor-page.component';
import { GameManagementPageComponent } from '@app/pages/game-management-page/game-management-page.component';
import { GameParametersPageComponent } from '@app/pages/game-parameters-page/game-parameters-page.component';
import { GameSessionCreationPageComponent } from '@app/pages/game-session-creation-page/game-session-creation-page.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { removeLeadingSlash } from '@src/utils/route/route.utils';
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
    // { path: removeLeadingSlash(ROUTES.gameEditor), component: GameEditorPageComponent },
    {
        path: removeLeadingSlash(ROUTES.gameEditor) + '/:id',
        component: GameEditorPageComponent,
    },
    { path: removeLeadingSlash(ROUTES.gameManagement), component: GameManagementPageComponent },
    {
        path: removeLeadingSlash(ROUTES.gameSessionCreation),
        component: GameSessionCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.characterCreation),
        component: CharacterCreationPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.waitingRoom),
        component: WaitingRoomPageComponent,
    },
    {
        path: removeLeadingSlash(ROUTES.gameParameters),
        component: GameParametersPageComponent,
    },
    { path: '**', redirectTo: removeLeadingSlash(ROUTES.home) },
];

enableProfiling();
bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
