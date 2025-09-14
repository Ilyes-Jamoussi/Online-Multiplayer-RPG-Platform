import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';
import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { EditorToolsService } from '@app/pages/admin-page/edit-game-page/services/editor-tools.service';
import { ActiveTool, TileKind } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component'; // generic panel

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
        { emoji: '🟩', class: 'base', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } } },
        { emoji: '🟫', class: 'wall', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.WALL } } },
        { emoji: '🚪', class: 'door', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.DOOR, open: false } } },
        { emoji: '💧', class: 'water', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.WATER } } },
        { emoji: '❄️', class: 'ice', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.ICE } } },
        { emoji: '🔮', class: 'teleport', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.TELEPORT, pairId: 'PENDING', endpoint: 'A' } } },
    ];

    select(item: BrushItem) {
        this.tools.setActiveTool(item.tool);
    }

    isBrushSelected(brush: BrushItem, activeTool: ActiveTool): boolean {
        return JSON.stringify(brush.tool) === JSON.stringify(activeTool);
    }
}
