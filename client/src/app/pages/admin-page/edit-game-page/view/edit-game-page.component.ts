import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgStyle } from '@angular/common';
import { Observable, map } from 'rxjs';

import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { TileService } from '@app/pages/admin-page/edit-game-page/services/tile.service';
//import { ObjectService } from '@app/pages/admin-page/edit-game-page/services/object.service';
import { EditorToolsService } from '@app/pages/admin-page/edit-game-page/services/editor-tools.service';

import { ActiveTool, Grid, InventoryState, TileActions } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

import { EditGameToolbarComponent } from '@app/pages/admin-page/edit-game-page/components/toolbar/edit-game-toolbar.component';
import { EditGameTileComponent } from '@app/pages/admin-page/edit-game-page/components/tile/edit-game-tile.component';
import { EditorInventoryComponent } from '@app/pages/admin-page/edit-game-page/components/inventory/inventory.component';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [AsyncPipe, NgStyle, EditGameToolbarComponent, EditGameTileComponent, EditorInventoryComponent],
    templateUrl: './edit-game-page.component.html',
    styleUrls: ['./edit-game-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameDraftService],
})
export class EditGamePageComponent implements OnInit {
    // inject new services
    private readonly draft = inject(GameDraftService);
    private readonly tiles = inject(TileService);
    //private readonly objects = inject(ObjectService);
    private readonly tools = inject(EditorToolsService);

    grid$!: Observable<Grid>;
    activeTool$!: Observable<ActiveTool>;
    inventory$!: Observable<InventoryState>;
    indices$!: Observable<number[]>;

    ngOnInit(): void {
        this.draft.initDraft('Nouveau jeu', 'Description…', 'l', 'CLASSIC', {
            x: 250,
            y: 250,
        });

        this.grid$ = this.draft.grid$;
        this.activeTool$ = this.draft.activeTool$;
        this.inventory$ = this.draft.inventory$;

        this.indices$ = this.grid$.pipe(map((g) => Array.from({ length: g.width * g.height }, (_, i) => i)));
    }

    trackByIndex = (_: number, i: number) => i;

    selectTool(tool: ActiveTool) {
        this.tools.setActiveTool(tool);
    }

    getCellSize(): number {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return 850 / 15;
    }

    getXFromIndex(idx: number, grid: Grid): number {
        return idx % grid.width;
    }

    getYFromIndex(idx: number, grid: Grid): number {
        return Math.floor(idx / grid.width);
    }

    readonly tileActions: Readonly<TileActions> = {
        leftClick: (x, y) => this.tiles.applyPaint(x, y),
        rightClick: (x, y) => this.tiles.applyRightClick(x, y),
        dragStart: (click: 'left' | 'right') => this.tools.toggleDragging(click),
        dragEnd: (click: 'left' | 'right') => this.tools.toggleDragging(click),
        dragPaint: (x, y) => this.tiles.dragPaint(x, y),
    };
}
