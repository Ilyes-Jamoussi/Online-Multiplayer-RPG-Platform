import { Component } from '@angular/core';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';
import { TileSprite as TileImage } from '@common/enums/tile-sprite.enum';

type BrushItem = {
    image: string;
    tileKind: TileKind;
    class: string;
};

@Component({
    selector: 'app-editor-toolbar',
    standalone: true,
    templateUrl: './game-editor-toolbar.component.html',
    styleUrls: ['./game-editor-toolbar.component.scss'],
    imports: [UiTooltipComponent],
})
export class GameEditorToolbarComponent {
    constructor(readonly gameEditorInteractionsService: GameEditorInteractionsService) {}

    selectTileBrush(tileKind: TileKind) {
        this.gameEditorInteractionsService.activeTool = {
            type: ToolType.TileBrushTool,
            tileKind,
            leftDrag: false,
            rightDrag: false,
        };
    }

    brushes: BrushItem[] = [
        { image: TileImage.WALL, class: 'wall', tileKind: TileKind.WALL },
        { image: TileImage.DOOR, class: 'door', tileKind: TileKind.DOOR },
        { image: TileImage.WATER, class: 'water', tileKind: TileKind.WATER },
        { image: TileImage.ICE, class: 'ice', tileKind: TileKind.ICE },
        { image: TileImage.TELEPORT, class: 'teleport', tileKind: TileKind.TELEPORT },
    ];

    isBrushSelected(brush: BrushItem): boolean {
        const activeTool = this.gameEditorInteractionsService.activeTool;
        if (!activeTool) return false;
        if (activeTool.type !== ToolType.TileBrushTool) return false;
        if ('tileKind' in activeTool) {
            return (activeTool as { tileKind: TileKind }).tileKind === brush.tileKind;
        }
        return false;
    }
}
