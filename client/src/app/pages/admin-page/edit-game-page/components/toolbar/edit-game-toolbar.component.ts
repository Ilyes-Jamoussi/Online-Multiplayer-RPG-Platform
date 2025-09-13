import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActiveTool, TileKind } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';

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
    imports: [UiTooltipComponent],
})
export class EditGameToolbarComponent {
    @Input() activeTool: ActiveTool | null = null;
    @Output() onSelectTool = new EventEmitter<ActiveTool>();

    brushes: BrushItem[] = [
        { emoji: '🟩', class: 'base', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.BASE } } },
        { emoji: '🟫', class: 'wall', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.WALL } } },
        { emoji: '🚪', class: 'door', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.DOOR, open: false } } },
        { emoji: '💧', class: 'water', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.WATER } } },
        { emoji: '❄️', class: 'ice', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.ICE } } },
        { emoji: '🔮', class: 'start', tool: { type: 'TILE_BRUSH', tile: { kind: TileKind.TELEPORT, pairId: 'PENDING', endpoint: 'A' } } },
    ];

    get selectedBrush(): BrushItem {
        return this.brushes.find((b) => JSON.stringify(b.tool) === JSON.stringify(this.activeTool)) || this.brushes[0];
    }

    isBrushSelected(brush: BrushItem): boolean {
        return JSON.stringify(brush.tool) === JSON.stringify(this.selectedBrush.tool);
    }

    select(item: BrushItem) {
        this.onSelectTool.emit(item.tool);
    }
}
