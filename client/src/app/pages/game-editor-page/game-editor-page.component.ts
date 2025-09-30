import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ErrorsBadgeComponent } from '@app/components/features/errors-badge/errors-badge.component';
import { GameEditorInventoryComponent } from '@app/components/features/game-editor-inventory/game-editor-inventory.component';
import { GameEditorObjectComponent } from '@app/components/features/game-editor-object/game-editor-object.component';
import { GameEditorTileComponent } from '@app/components/features/game-editor-tile/game-editor-tile.component';
import { GameEditorToolbarComponent } from '@app/components/features/game-editor-toolbar/game-editor-toolbar.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { DESCRIPTION_MAX_LENGTH, GAME_NAME_MAX_LENGTH } from '@app/constants/validation.constants';
import { TileSizeProbeDirective } from '@app/directives/tile-size/tile-size-probe.directive';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { distinctUntilChanged, filter, map, Subject, takeUntil, tap } from 'rxjs';

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
        UiInputComponent,
        GameEditorInventoryComponent,
        GameEditorObjectComponent,
        UiButtonComponent,
        ErrorsBadgeComponent,
    ],
    templateUrl: './game-editor-page.component.html',
    styleUrls: ['./game-editor-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GameEditorStoreService, GameEditorInteractionsService, GameEditorCheckService],
})
export class GameEditorPageComponent implements OnInit, OnDestroy {
    readonly gameNameMaxLength = GAME_NAME_MAX_LENGTH;
    readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;

    @ViewChild('gridWrapper', { static: false }) gridWrapper!: ElementRef<HTMLElement>;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly gameEditorStoreService: GameEditorStoreService,
        private readonly gameEditorCheckService: GameEditorCheckService,
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
        private readonly notificationService: NotificationService,
    ) {}

    readonly gameId$ = this.activatedRoute.paramMap.pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
    );

    get disableOverlayPointerEvents() {
        const tool = this.gameEditorInteractionsService.activeTool;
        return tool !== null && tool.type === ToolType.TileBrushTool && (tool.leftDrag || tool.rightDrag);
    }

    get tiles() {
        return this.gameEditorStoreService.tiles();
    }

    get size() {
        return this.gameEditorStoreService.size();
    }

    get placedObjects() {
        return this.gameEditorStoreService.placedObjects;
    }

    get tileSizePx() {
        return this.gameEditorStoreService.tileSizePx;
    }

    get name() {
        return this.gameEditorStoreService.name;
    }

    set name(newName: string) {
        this.gameEditorStoreService.name = newName;
    }

    get description() {
        return this.gameEditorStoreService.description;
    }

    set description(newDescription: string) {
        this.gameEditorStoreService.description = newDescription;
    }

    get canSave() {
        return this.gameEditorCheckService.canSave();
    }

    ngOnInit(): void {
        this.gameId$
            .pipe(
                tap((id) => this.gameEditorStoreService.loadGameById(id)),
                takeUntil(this.destroy$),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onReset(): void {
        this.gameEditorStoreService.reset();
    }

    onResize(newSize: number): void {
        this.gameEditorStoreService.tileSizePx = newSize;
    }

    @HostListener('drop', ['$event'])
    onDropOutsideOfGrid(evt: DragEvent): void {
        evt.preventDefault();
        this.gameEditorInteractionsService.activeTool = {
            type: ToolType.PlaceableEraserTool,
        };
        this.gameEditorInteractionsService.removeObject();
    }

    @HostListener('dragover', ['$event'])
    onDragOver(evt: DragEvent): void {
        evt.preventDefault();
    }

    @HostListener('mouseover', ['$event'])
    onMouseOver(evt: MouseEvent): void {
        const target = evt.target as HTMLElement;
        if (!target.classList.contains('tile')) {
            this.gameEditorInteractionsService.dragEnd();
        }
    }

    async onSave(): Promise<void> {
        if (this.gameEditorCheckService.canSave()) {
            try {
                await this.gameEditorStoreService.saveGame(this.gridWrapper.nativeElement);
                this.notificationService.displaySuccess({
                    title: 'Jeu sauvegardé',
                    message: 'Votre jeu a été sauvegardé avec succès !',
                    redirectRoute: ROUTES.gameManagement,
                });
            } catch (error) {
                if (error instanceof Error) {
                    this.notificationService.displayError({
                        title: 'Erreur lors de la sauvegarde',
                        message: error.message,
                    });
                }
            }
        } else {
            this.notificationService.displayError({
                title: 'Problèmes dans la carte',
                message: 'Veuillez corriger les problèmes dans la carte avant de sauvegarder.',
            });
        }
    }
}
