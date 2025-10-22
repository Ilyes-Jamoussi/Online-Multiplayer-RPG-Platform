import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';
import { MapSize } from '@common/enums/map-size.enum';

@Component({
    selector: 'app-game-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-info.component.html',
    styleUrls: ['./game-info.component.scss']
})
export class GameInfoComponent {
    @Input() mapSize: MapSize = MapSize.MEDIUM;
    @Input() activePlayer: string = '';

    constructor(private readonly sessionService: SessionService) {}

    get players() {
        return this.sessionService.players();
    }

    get playerCount(): number {
        return this.players.length;
    }

    get mapSizeLabel(): string {
        switch (this.mapSize) {
            case MapSize.SMALL: return 'Petite';
            case MapSize.MEDIUM: return 'Moyenne';
            case MapSize.LARGE: return 'Grande';
            default: return 'Inconnue';
        }
    }
}
