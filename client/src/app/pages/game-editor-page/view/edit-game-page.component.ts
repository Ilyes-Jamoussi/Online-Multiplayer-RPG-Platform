import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgStyle } from '@angular/common';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, switchMap, take, tap } from 'rxjs/operators';

import { ROUTES } from '@app/constants/routes.constants';
import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
import { TileService } from '@app/services/game/game-editor/tile.service';
import { ObjectService } from '@app/services/game/game-editor/object.service';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { GameSaveService } from '@app/services/game/game-editor/game-save.service';

import { ActiveTool, Grid, InventoryState, PlaceableObject } from '@app/interfaces/game/game-editor.interface';
import { EditGameToolbarComponent } from '@app/pages/game-editor-page/components/toolbar/edit-game-toolbar.component';
import { EditGameTileComponent } from '@app/pages/game-editor-page/components/tile/edit-game-tile.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
import { EditorInventoryComponent } from '@app/pages/game-editor-page/components/inventory/inventory.component';
import { EditBaseObjectComponent } from '@app/pages/game-editor-page/components/object/base-object/base-object.component';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { GameMode } from '@common/enums/game-mode.enum';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [AsyncPipe, NgStyle, EditGameToolbarComponent, EditGameTileComponent, EditorInventoryComponent, EditBaseObjectComponent, UiPageLayoutComponent, UiButtonComponent],
    templateUrl: './edit-game-page.component.html',
    styleUrls: ['./edit-game-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameDraftService, GameSaveService, TileService, EditorToolsService, ObjectService, TileSizeProbeDirective],
})
export class EditGamePageComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly draft = inject(GameDraftService);
    private readonly save = inject(GameSaveService);
    private readonly tools = inject(EditorToolsService);

    grid$!: Observable<Grid>;
    activeTool$!: Observable<ActiveTool>;
    inventory$!: Observable<InventoryState>;
    tileSize$!: Observable<number>;
    objects$!: Observable<PlaceableObject[]>;

    ngOnInit(): void {
        this.grid$ = this.draft.grid$;
        this.activeTool$ = this.draft.activeTool$;
        this.tileSize$ = this.draft.editorTileSize$;
        this.inventory$ = this.draft.inventory$;
        this.objects$ = this.draft.objectsArray$;

        this.route.paramMap
            .pipe(
                map((pm) => pm.get('id')),
                distinctUntilChanged(),
                switchMap((id) => {
                    if (id) {
                        return this.save.loadGame$(id).pipe(
                            tap((d) => this.draft.loadDraft(d)),
                            catchError(() => {
                                this.initNewDraft();
                                return of(null);
                            }),
                        );
                    } else {
                        this.initNewDraft();
                        return of(null);
                    }
                }),
            )
            .subscribe();
    }

    private initNewDraft(): void {
        this.draft.initDraft('Nouveau jeu', 'Description…', 'l', GameMode.CLASSIC);
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

    saveDraft() {
        this.save
            .updateGame()
            .pipe(take(1))
            .subscribe({
                next: () => {
                    // todo show success message, show notification
                },
                error: () => {
                    // todo handle error message, show error notification
                },
            });
    }

    goBack(): void {
        this.router.navigate([ROUTES.gameManagement]);
    }
}
