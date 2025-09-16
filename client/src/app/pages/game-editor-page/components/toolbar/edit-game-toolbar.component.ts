import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';
import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { ActiveTool } from '@app/interfaces/game/game-editor.interface';

import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component'; // generic panel
import { TileKind } from '@common/enums/tile-kind.enum';

interface BrushItem {
    emoji: string;
    tool: ActiveTool;
    class: string;
}

@Component({
    selector: 'app-edit-game-toolbar',
    standalone: true,
    templateUrl: './edit-game-toolbar.component.html',
    styleUrls: ['./edit-game-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [UiTooltipComponent, AsyncPipe, DraggablePanelComponent],
})
export class EditGameToolbarComponent {
    private readonly draft = inject(GameDraftService);
    private readonly tools = inject(EditorToolsService);

    activeTool$ = this.draft.activeTool$;

    brushes: BrushItem[] = [
        { emoji: '🟩', class: 'base', tool: { type: 'TILE_BRUSH', tile: TileKind.BASE } },
        { emoji: '🟫', class: 'wall', tool: { type: 'TILE_BRUSH', tile: TileKind.WALL } },
        { emoji: '🚪', class: 'door', tool: { type: 'TILE_BRUSH', tile: TileKind.DOOR } },
        { emoji: '💧', class: 'water', tool: { type: 'TILE_BRUSH', tile: TileKind.WATER } },
        { emoji: '❄️', class: 'ice', tool: { type: 'TILE_BRUSH', tile: TileKind.ICE } },
        { emoji: '🔮', class: 'teleport', tool: { type: 'TILE_BRUSH', tile: TileKind.TELEPORT } },
    ];

    select(item: BrushItem) {
        this.tools.setActiveTool(item.tool);
    }

    isBrushSelected(brush: BrushItem, activeTool: ActiveTool): boolean {
        return JSON.stringify(brush.tool) === JSON.stringify(activeTool);
    }
}
