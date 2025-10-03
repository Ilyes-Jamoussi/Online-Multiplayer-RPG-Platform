import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { GamePreviewCardComponent } from '@app/components/features/game-preview-card/game-preview-card.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';

@Component({
    selector: 'app-session-creation-page',
    templateUrl: './session-creation-page.component.html',
    styleUrls: ['./session-creation-page.component.scss'],
    standalone: true,
    imports: [CommonModule, GamePreviewCardComponent, UiPageLayoutComponent],
})
export class SessionCreationPageComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly gameStoreService: GameStoreService,
    ) {}

    get visibleGameDisplays(): Signal<GamePreviewDto[]> {
        return this.gameStoreService.visibleGames;
    }

    ngOnInit(): void {
        this.gameStoreService.loadGames().subscribe();
    }

    onStartGame(): void {
        this.router.navigate([ROUTES.characterCreationPage]);
    }

    onBack(): void {
        this.router.navigate([ROUTES.homePage]);
    }
}
