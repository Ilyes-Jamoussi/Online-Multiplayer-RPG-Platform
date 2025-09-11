import { Component, OnInit, inject } from '@angular/core';
import { GamesFacade } from '@app/services/games/games.facade.service';
import { GameCardComponent } from '@app/pages/admin-page/game-list-page/components/game-card/game-card.component';

@Component({
    selector: 'app-game-list-page',
    standalone: true,
    templateUrl: './game-list-page.component.html',
    styleUrls: ['./game-list-page.component.scss'],
    imports: [GameCardComponent],
})
export class GameListPageComponent implements OnInit {
    private readonly facade = inject(GamesFacade);
    readonly games = this.facade.games;
    readonly loading = this.facade.loading;
    readonly error = this.facade.error;

    ngOnInit(): void {
        this.facade.refresh();
    }

    onToggleVisibility(gameId: string, visible: boolean): void {
        this.facade.toggleVisibility(gameId, visible);
    }

    onDelete(gameId: string): void {
        this.facade.delete(gameId);
    }

    // onEdit(gameId: string): void {
    //     // todo navigate to the editor page
    // }
}
