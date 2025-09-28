import { Component } from '@angular/core';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { UiTooltipComponent } from '@app/components/ui/tooltip/tooltip.component';
import { ToolbarItem, ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';

@Component({
    selector: 'app-editor-toolbar',
    standalone: true,
    templateUrl: './game-editor-toolbar.component.html',
    styleUrls: ['./game-editor-toolbar.component.scss'],
    imports: [UiTooltipComponent],
})
export class GameEditorToolbarComponent {
    constructor(
        readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly assetsService: AssetsService,
    ) {}

    selectTileBrush(tileKind: TileKind) {
        this.gameEditorInteractionsService.activeTool = {
            type: ToolType.TileBrushTool,
            tileKind,
            leftDrag: false,
            rightDrag: false,
        };
    }

    brushes: ToolbarItem[] = [
        { image: this.assetsService.getTileImage(TileKind.WALL), class: 'wall', tileKind: TileKind.WALL },
        { image: this.assetsService.getTileImage(TileKind.DOOR), class: 'door', tileKind: TileKind.DOOR },
        { image: this.assetsService.getTileImage(TileKind.WATER), class: 'water', tileKind: TileKind.WATER },
        { image: this.assetsService.getTileImage(TileKind.ICE), class: 'ice', tileKind: TileKind.ICE },
        { image: this.assetsService.getTileImage(TileKind.TELEPORT), class: 'teleport', tileKind: TileKind.TELEPORT },
    ];

    isBrushSelected(brush: ToolbarItem): boolean {
        const activeTool = this.gameEditorInteractionsService.activeTool;
        if (!activeTool) return false;
        if (activeTool.type !== ToolType.TileBrushTool) return false;
        if ('tileKind' in activeTool) {
            return (activeTool as { tileKind: TileKind }).tileKind === brush.tileKind;
        }
        return false;
    }
}
