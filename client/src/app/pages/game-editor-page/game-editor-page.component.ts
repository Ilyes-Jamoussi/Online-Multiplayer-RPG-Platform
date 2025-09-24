import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgStyle } from '@angular/common';
import { distinctUntilChanged, filter, map, Subject, takeUntil, tap } from 'rxjs';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
import { GameEditorTileComponent } from './components/tile/game-editor-tile.component';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileSizeProbeDirective } from './directives/tile-size-probe.directive';
import { GameEditorToolbarComponent } from './components/toolbar/game-editor-toolbar.component';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiInputComponent } from '@app/shared/ui/components/input/input.component';
import { FormsModule } from '@angular/forms';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { DraggablePanelComponent } from '@app/shared/ui/components/draggable-panel/draggable-panel.component';
import { GameEditorInventoryComponent } from './components/inventory/game-editor-inventory.component';
import { GameEditorObjectComponent } from './components/object/object.component';
import { GameEditorErrorsDisplayComponent } from './components/errross-display/errors-display.component';
import { ROUTES } from '@app/constants/routes.constants';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [
        NgStyle,
        FormsModule,
        UiPageLayoutComponent,
        GameEditorTileComponent,
        TileSizeProbeDirective,
        GameEditorToolbarComponent,
        UiButtonComponent,
        UiInputComponent,
        DraggablePanelComponent,
        GameEditorInventoryComponent,
        GameEditorObjectComponent,
        GameEditorErrorsDisplayComponent,
    ],
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameEditorStoreService, GameEditorInteractionsService, GameEditorCheckService],
})
export class GameEditorPageComponent implements OnInit, OnDestroy {
    @ViewChild('gridWrapper', { static: false }) gridWrapper!: ElementRef<HTMLElement>;
    
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly route: ActivatedRoute,
        readonly store: GameEditorStoreService,
        readonly editorCheck: GameEditorCheckService,
        private readonly notification: NotificationService,
        private readonly screenshotService: ScreenshotService,
    ) {}

    readonly gameId$ = this.route.paramMap.pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
    );

    ngOnInit(): void {
        this.gameId$
            .pipe(
                tap((id) => this.store.loadGameById(id)),
                takeUntil(this.destroy$),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    goBack(): void {
        window.history.back();
    }

    onReset(): void {
        this.store.reset();
    }

    onResize(newSize: number): void {
        this.store.tileSizePx = newSize;
    }

    async onSave(): Promise<void> {
        if (this.editorCheck.canSave()) {
            const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
            this.store.saveGame(gridPreviewImage);
            this.notification.displaySuccess({
                title: 'Jeu sauvegardé',
                message: 'Votre jeu a été sauvegardé avec succès !',
                redirectRoute: ROUTES.gameManagement,
            });
        } else {
            this.notification.displayError({
                title: 'Problèmes dans la carte',
                message: 'Veuillez corriger les problèmes dans la carte avant de sauvegarder.',
            });
        }
    }
}

// import { AsyncPipe, NgStyle } from '@angular/common';
// import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

// import { ROUTES } from '@app/constants/routes.constants';
// import { EditorToolsService } from '@app/services/game/game-editor/game-editor-draft.service';
// import { GameDraftService } from '@app/services/game/game-editor/game-draft.service';
// import { ObjectService } from '@app/services/game/game-editor/game-editor-placeable.service';
// import { TileService } from '@app/services/game/game-editor/tile.service';
// import { GameStoreService } from '@app/services/game/game-store/game-store.service';
// import { NotificationService } from '@app/services/notification/notification.service';
// import { ScreenshotService } from '@app/services/screenshot/screenshot.service';

// import { ActiveTool, Grid, InventoryState, PlaceableObject } from '@app/interfaces/game/game-editor.interface';
// import { EditorInventoryComponent } from '@app/pages/game-editor-page/components/inventory/inventory.component';
// import { EditBaseObjectComponent } from '@app/pages/game-editor-page/components/object/base-object/base-object.component';
// import { EditGameTileComponent } from '@app/pages/game-editor-page/components/tile/edit-game-tile.component';
// import { EditGameToolbarComponent } from '@app/pages/game-editor-page/components/toolbar/edit-game-toolbar.component';
// import { TileSizeProbeDirective } from '@app/pages/game-editor-page/directives/tile-size-probe.directive';
// import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
// import { UiInputComponent } from '@app/shared/ui/components/input/input.component';
// import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';
// import { GameMode } from '@common/enums/game-mode.enum';

// @Component({
//     selector: 'app-edit-game-page',
//     standalone: true,
//     imports: [
//         AsyncPipe,
//         NgStyle,
//         FormsModule,
//         EditGameToolbarComponent,
//         EditGameTileComponent,
//         EditorInventoryComponent,
//         EditBaseObjectComponent,
//         UiPageLayoutComponent,
//         UiButtonComponent,
//         UiInputComponent,
//     ],
//     templateUrl: './game-editor-page.component.html',
//     styleUrls: ['./game-editor-page.component.scss'],
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     providers: [GameDraftService, TileService, EditorToolsService, ObjectService, TileSizeProbeDirective],
// })
// export class GameEditorPageComponent implements OnInit {
//     @ViewChild('gridWrapper', { static: false }) gridWrapper!: ElementRef<HTMLElement>;

//     get gameName(): string {
//         return this.gameStoreService.name();
//     }

//     set gameName(value: string) {
//         this.gameStoreService.setName(value);
//     }

//     get gameDescription(): string {
//         return this.gameStoreService.description();
//     }

//     set gameDescription(value: string) {
//         this.gameStoreService.setDescription(value);
//     }

//     grid$!: Observable<Grid>;
//     activeTool$!: Observable<ActiveTool>;
//     inventory$!: Observable<InventoryState>;
//     tileSize$!: Observable<number>;
//     objects$!: Observable<PlaceableObject[]>;

//     private readonly editorToolsService = inject(EditorToolsService);
//     private readonly notificationService = inject(NotificationService);

//     constructor(
//         private readonly route: ActivatedRoute,
//         private readonly router: Router,
//         private readonly gameDraftService: GameDraftService,
//         readonly gameStoreService: GameStoreService,
//         private readonly screenshotService: ScreenshotService,
//     ) {}

//     ngOnInit(): void {
//         this.grid$ = this.gameDraftService.grid$;
//         this.activeTool$ = this.gameDraftService.activeTool$;
//         this.tileSize$ = this.gameDraftService.editorTileSize$;
//         this.inventory$ = this.gameDraftService.inventory$;
//         this.objects$ = this.gameDraftService.objectsArray$;

//         this.route.paramMap
//             .pipe(
//                 map((pm) => pm.get('id')),
//                 distinctUntilChanged(),
//                 switchMap((id) => {
//                     if (id) {
//                         // TODO: Implémenter le chargement du jeu depuis GameStoreService
//                         this.initNewDraft();
//                         return of(null);
//                     } else {
//                         this.initNewDraft();
//                         return of(null);
//                     }
//                 }),
//             )
//             .subscribe();
//     }

//     private initNewDraft(): void {
//         this.gameDraftService.initDraft('Nouveau jeu', 'Description…', 'l', GameMode.CLASSIC);
//     }

//     trackByIndex = (_: number, i: number) => i;

//     selectTool(tool: ActiveTool) {
//         this.editorToolsService.setActiveTool(tool);
//     }
//     tileSizeUpdate(size: number) {
//         this.gameDraftService.setEditorTileSize(size);
//     }
//     getXFromIndex(idx: number, grid: Grid): number {
//         return idx % grid.width;
//     }
//     getYFromIndex(idx: number, grid: Grid): number {
//         return Math.floor(idx / grid.width);
//     }

//     resetGrid(): void {
//         // Pour le moment, ne fait rien - à implémenter plus tard
//     }

//     async createGame(): Promise<void> {
//         // Capturer l'image de la grille
//         const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
//         this.gameStoreService.setGridPreviewImage(gridPreviewImage);

//         this.gameStoreService.createGame().subscribe({
//             next: () => {
//                 this.notificationService.displaySuccess({
//                     title: 'Succès',
//                     message: 'Jeu créé avec succès',
//                     redirectRoute: ROUTES.gameManagement,
//                 });
//             },
//             error: () => {
//                 this.notificationService.displayError({
//                     title: 'Erreur',
//                     message: 'Échec de la création du jeu',
//                 });
//             },
//         });
//     }

//     async updateGame(): Promise<void> {
//         // Capturer l'image de la grille
//         const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
//         this.gameStoreService.setGridPreviewImage(gridPreviewImage);

//         this.gameStoreService.updateGame().subscribe({
//             next: () => {
//                 this.notificationService.displaySuccess({
//                     title: 'Succès',
//                     message: 'Jeu mis à jour avec succès',
//                     redirectRoute: ROUTES.gameManagement,
//                 });
//             },
//             error: () => {
//                 this.notificationService.displayError({
//                     title: 'Erreur',
//                     message: 'Échec de la mise à jour du jeu',
//                 });
//             },
//         });
//     }

//     goBack(): void {
//         this.router.navigate([ROUTES.gameManagement]);
//     }
// }
