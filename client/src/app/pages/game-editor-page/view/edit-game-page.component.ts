import { AsyncPipe, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
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
        return this.gameStoreService.name();
    }

    set gameName(value: string) {
        this.gameStoreService.setName(value);
    }

    get gameDescription(): string {
        return this.gameStoreService.description();
    }

    set gameDescription(value: string) {
        this.gameStoreService.setDescription(value);
    }

    grid$!: Observable<Grid>;
    activeTool$!: Observable<ActiveTool>;
    inventory$!: Observable<InventoryState>;
    tileSize$!: Observable<number>;
    objects$!: Observable<PlaceableObject[]>;

    private readonly editorToolsService = inject(EditorToolsService);
    private readonly notificationService = inject(NotificationService);

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly gameDraftService: GameDraftService,
        readonly gameStoreService: GameStoreService,
        private readonly screenshotService: ScreenshotService,
    ) {}

    ngOnInit(): void {
        this.grid$ = this.gameDraftService.grid$;
        this.activeTool$ = this.gameDraftService.activeTool$;
        this.tileSize$ = this.gameDraftService.editorTileSize$;
        this.inventory$ = this.gameDraftService.inventory$;
        this.objects$ = this.gameDraftService.objectsArray$;

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
        this.gameDraftService.initDraft('Nouveau jeu', 'Description…', 'l', GameMode.CLASSIC);
    }

    trackByIndex = (_: number, i: number) => i;

    selectTool(tool: ActiveTool) {
        this.editorToolsService.setActiveTool(tool);
    }
    tileSizeUpdate(size: number) {
        this.gameDraftService.setEditorTileSize(size);
    }
    getXFromIndex(idx: number, grid: Grid): number {
        return idx % grid.width;
    }
    getYFromIndex(idx: number, grid: Grid): number {
        return Math.floor(idx / grid.width);
    }

    resetGrid(): void {
        // Pour le moment, ne fait rien - à implémenter plus tard
    }

    async createGame(): Promise<void> {
        // Capturer l'image de la grille
        const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
        this.gameStoreService.setGridPreviewImage(gridPreviewImage);

        this.gameStoreService.createGame().subscribe({
            next: () => {
                this.notificationService.displaySuccess({
                    title: 'Succès',
                    message: 'Jeu créé avec succès',
                    redirectRoute: ROUTES.gameManagement
                });
            },
            error: () => {
                this.notificationService.displayError({
                    title: 'Erreur',
                    message: 'Échec de la création du jeu'
                });
            }
        });
    }

    async updateGame(): Promise<void> {
        // Capturer l'image de la grille
        const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
        this.gameStoreService.setGridPreviewImage(gridPreviewImage);

        this.gameStoreService.updateGame().subscribe({
            next: () => {
                this.notificationService.displaySuccess({
                    title: 'Succès',
                    message: 'Jeu mis à jour avec succès',
                    redirectRoute: ROUTES.gameManagement
                });
            },
            error: () => {
                this.notificationService.displayError({
                    title: 'Erreur',
                    message: 'Échec de la mise à jour du jeu'
                });
            }
        });
    }

    goBack(): void {
        this.router.navigate([ROUTES.gameManagement]);
    }
}
