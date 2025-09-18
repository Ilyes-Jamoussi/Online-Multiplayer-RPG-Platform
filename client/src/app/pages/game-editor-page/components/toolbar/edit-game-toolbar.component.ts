import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';
import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { ActiveTool } from '@app/interfaces/game/game-editor.interface';

import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component'; // generic panel
import { TileKind } from '@common/enums/tile-kind.enum';

interface BrushItem {
    image: string;
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
    activeTool$ = this.gameDraftService.activeTool$;

    brushes: BrushItem[] = [
        { image: '/assets/tiles/sand.png', class: 'base', tool: { type: 'TILE_BRUSH', tile: TileKind.BASE } },
        { image: '/assets/tiles/wall.png', class: 'wall', tool: { type: 'TILE_BRUSH', tile: TileKind.WALL } },
        { image: '/assets/tiles/closed-door.png', class: 'door', tool: { type: 'TILE_BRUSH', tile: TileKind.DOOR } },
        { image: '/assets/tiles/water.png', class: 'water', tool: { type: 'TILE_BRUSH', tile: TileKind.WATER } },
        { image: '/assets/tiles/ice.png', class: 'ice', tool: { type: 'TILE_BRUSH', tile: TileKind.ICE } },
        { image: '/assets/tiles/teleport-portal.png', class: 'teleport', tool: { type: 'TILE_BRUSH', tile: TileKind.TELEPORT } },
    ];

    constructor(
        private readonly gameDraftService: GameDraftService,
        private readonly editorToolsService: EditorToolsService,
    ) {}

    select(item: BrushItem) {
        this.editorToolsService.setActiveTool(item.tool);
    }

    isBrushSelected(brush: BrushItem, activeTool: ActiveTool): boolean {
        return JSON.stringify(brush.tool) === JSON.stringify(activeTool);
    }
}
