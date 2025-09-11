import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TileActions, TileKind, TileSpec } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

@Component({
    selector: 'app-edit-game-tile',
    standalone: true,
    imports: [NgStyle],
    templateUrl: './edit-game-tile.component.html',
    styleUrls: ['./edit-game-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGameTileComponent {
    @Input({ required: true }) tile!: TileSpec;
    @Input({ required: true }) x!: number;
    @Input({ required: true }) y!: number;

    @Input({ required: true }) actions: TileActions;

    onClick() {
        if (this.actions?.leftClick) {
            this.actions.leftClick(this.x, this.y);
        }
    }

    onRightClick(event: MouseEvent) {
        event.preventDefault();
        if (this.actions?.rightClick) {
            this.actions.rightClick(this.x, this.y);
        }
    }

    colorOf(kind: TileKind): string {
        switch (kind) {
            case TileKind.BASE:
                return '#a3e635';
            case TileKind.WALL:
                return '#374151';
            case TileKind.DOOR:
                return '#fbbf24';
            case TileKind.WATER:
                return '#60a5fa';
            case TileKind.ICE:
                return '#93c5fd';
            case TileKind.TELEPORT:
                return '#f472b6';
            default:
                return '#ffffff';
        }
    }
}
