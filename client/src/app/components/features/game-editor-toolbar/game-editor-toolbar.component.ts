import { Component } from '@angular/core';
import { TileLabel } from '@app/enums/tile-label.enum';
import { ToolbarItem, ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile.enum';

@Component({
    selector: 'app-editor-toolbar',
    standalone: true,
    templateUrl: './game-editor-toolbar.component.html',
    styleUrls: ['./game-editor-toolbar.component.scss'],
})
export class GameEditorToolbarComponent {
    readonly tileLabel = TileLabel;

    constructor(private readonly gameEditorInteractionsService: GameEditorInteractionsService) {}

    get brushes() {
        return this.gameEditorInteractionsService.getToolbarBrushes();
    }

    selectTileBrush(tileKind: TileKind): void {
        this.gameEditorInteractionsService.activeTool = {
            type: ToolType.TileBrushTool,
            tileKind,
            leftDrag: false,
            rightDrag: false,
        };
    }

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
