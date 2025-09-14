import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgStyle } from '@angular/common';
import { Observable, map } from 'rxjs';

import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { TileService } from '@app/pages/admin-page/edit-game-page/services/tile.service';
import { ObjectService } from '@app/pages/admin-page/edit-game-page/services/object.service';
import { EditorToolsService } from '@app/pages/admin-page/edit-game-page/services/editor-tools.service';

import { ActiveTool, Grid, InventoryState, PlaceableObject } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

import { EditGameToolbarComponent } from '@app/pages/admin-page/edit-game-page/components/toolbar/edit-game-toolbar.component';
import { EditGameTileComponent } from '@app/pages/admin-page/edit-game-page/components/tile/edit-game-tile.component';
import { TileSizeProbeDirective } from '@app/pages/admin-page/edit-game-page/directives/tile-size-probe.directive';
import { EditorInventoryComponent } from '@app/pages/admin-page/edit-game-page/components/inventory/inventory.component';
import { EditBaseObjectComponent } from '@app/pages/admin-page/edit-game-page/components/object/base-object/base-object.component';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [AsyncPipe, NgStyle, EditGameToolbarComponent, EditGameTileComponent, EditorInventoryComponent, EditBaseObjectComponent],
    templateUrl: './edit-game-page.component.html',
    styleUrls: ['./edit-game-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameDraftService, TileService, EditorToolsService, ObjectService, TileSizeProbeDirective],
})
export class EditGamePageComponent implements OnInit {
    // inject new services
    private readonly draft = inject(GameDraftService);
    private readonly tools = inject(EditorToolsService);

    grid$!: Observable<Grid>;
    activeTool$!: Observable<ActiveTool>;
    inventory$!: Observable<InventoryState>;
    indices$!: Observable<number[]>;
    tileSize$!: Observable<number>;
    objects$!: Observable<PlaceableObject[]>;

    constructor() {
        this.draft.initDraft('Nouveau jeu', 'Description…', 's', 'CLASSIC');
    }

    ngOnInit(): void {
        this.grid$ = this.draft.grid$;
        this.activeTool$ = this.draft.activeTool$;
        this.tileSize$ = this.draft.editorTileSize$;
        this.inventory$ = this.draft.inventory$;
        this.indices$ = this.grid$.pipe(map((g) => Array.from({ length: g.width * g.height }, (_, i) => i)));
        this.objects$ = this.draft.objectsArray$;
    }

    trackByIndex = (_: number, i: number) => i;

    selectTool(tool: ActiveTool) {
        this.tools.setActiveTool(tool);
    }

    tileSizeUpdate(size: number) {
        this.draft.setEditorTileSize(size);
    }

    getXFromIndex(idx: number, grid: Grid): number {
        return idx % grid.width;
    }

    getYFromIndex(idx: number, grid: Grid): number {
        return Math.floor(idx / grid.width);
    }
}
