import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@common/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';

@Component({
    selector: 'app-session-creation-page',
    templateUrl: './session-creation-page.component.html',
    styleUrls: ['./session-creation-page.component.scss'],
    standalone: true,
    imports: [GamePreviewCardComponent, UiPageLayoutComponent],
})
export class SessionCreationPageComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
        private readonly sessionService: SessionService,
        private readonly playerService: PlayerService,
    ) {}

    get visibleGameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.visibleGames;
    }

    ngOnInit(): void {
        this.playerService.setAsAdmin();
        this.gameStoreService.loadGames().subscribe();
    }

    onStartGame(game: GamePreviewDto): void {
        this.sessionService.initializeSessionWithGame(game.id, game.size);
    }

    onBack(): void {
        this.router.navigate([ROUTES.HomePage]);
    }
}
