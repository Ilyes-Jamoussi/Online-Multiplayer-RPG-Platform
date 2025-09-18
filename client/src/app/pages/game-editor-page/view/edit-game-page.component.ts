import { AsyncPipe, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { ROUTES } from '@app/constants/routes.constants';
import { EditorToolsService } from '@app/services/game/game-editor/editor-tools.service';
import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
import { ObjectService } from '@app/services/game/game-editor/object.service';
import { TileService } from '@app/services/game/game-editor/tile.service';
import { GameStoreService } from '@app/services/game/game-store/game-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';

import { ActiveTool, Grid, InventoryState, PlaceableObject } from '@app/interfaces/game/game-editor.interface';
import { EditorInventoryComponent } from '@app/pages/game-editor-page/components/inventory/inventory.component';
import { EditBaseObjectComponent } from '@app/pages/game-editor-page/components/object/base-object/base-object.component';
import { EditGameTileComponent } from '@app/pages/game-editor-page/components/tile/edit-game-tile.component';
import { EditGameToolbarComponent } from '@app/pages/game-editor-page/components/toolbar/edit-game-toolbar.component';
import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { GameMode } from '@common/enums/game-mode.enum';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [
        AsyncPipe,
        NgStyle,
        FormsModule,
        EditGameToolbarComponent,
        EditGameTileComponent,
        EditorInventoryComponent,
        EditBaseObjectComponent,
        UiPageLayoutComponent,
        UiButtonComponent,
    ],
    templateUrl: './edit-game-page.component.html',
    styleUrls: ['./edit-game-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameDraftService, TileService, EditorToolsService, ObjectService, TileSizeProbeDirective],
})
export class EditGamePageComponent implements OnInit {
    @ViewChild('gridWrapper', { static: false }) gridWrapper!: ElementRef<HTMLElement>;

    get gameName(): string {
        return this.gameStore.name();
    }

    set gameName(value: string) {
        this.gameStore.setName(value);
    }

    get gameDescription(): string {
        return this.gameStore.description();
    }

    set gameDescription(value: string) {
        this.gameStore.setDescription(value);
    }

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly draft = inject(GameDraftService);
    private readonly gameStore = inject(GameStoreService);
    private readonly tools = inject(EditorToolsService);
    private readonly screenshot = inject(ScreenshotService);
    private readonly notification = inject(NotificationService);

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
                        // TODO: Implémenter le chargement du jeu depuis GameStoreService
                        this.initNewDraft();
                        return of(null);
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

    async saveDraft() {
        // Capturer l'image de la grille
        const gridPreviewImage = await this.screenshot.captureElementAsBase64(this.gridWrapper.nativeElement);
        this.gameStore.setGridPreviewImage(gridPreviewImage);

        if (this.gameStore.gameId) {
            // UPDATE - jeu existant
            this.gameStore.updateGame().subscribe({
                next: () => {
                    this.notification.displaySuccess({
                        title: 'Succès',
                        message: 'Jeu mis à jour avec succès'
                    });
                },
                error: () => {
                    this.notification.displayError({
                        title: 'Erreur',
                        message: 'Échec de la mise à jour du jeu'
                    });
                },
            });
        } else {
            // CREATE - nouveau jeu
            console.log('Creating game with DTO:', this.gameStore.buildCreateGameDto());
            this.gameStore.createGame().subscribe({
                next: (response) => {
                    console.log('Game created successfully:', response);
                    this.notification.displaySuccess({
                        title: 'Succès',
                        message: 'Jeu créé avec succès'
                    });
                },
                error: (error) => {
                    console.error('Error creating game:', error);
                    this.notification.displayError({
                        title: 'Erreur',
                        message: 'Échec de la création du jeu'
                    });
                },
            });
        }
    }

    goBack(): void {
        this.router.navigate([ROUTES.gameManagement]);
    }
}
