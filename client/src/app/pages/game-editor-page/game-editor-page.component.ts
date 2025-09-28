import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ErrorsBadgeComponent } from '@app/components/features/errors-badge/errors-badge.component';
import { ROUTES } from '@app/constants/routes.constants';
import { DESCRIPTION_MAX_LENGTH, GAME_NAME_MAX_LENGTH } from '@app/constants/validation.constants';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService, ToolType } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { DraggablePanelComponent } from '@app/components/ui/draggable-panel/draggable-panel.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { distinctUntilChanged, filter, map, Subject, takeUntil, tap } from 'rxjs';
import { GameEditorInventoryComponent } from '@app/components/features/inventory/game-editor-inventory.component';
import { GameEditorObjectComponent } from '@app/components/features/object/object.component';
import { GameEditorTileComponent } from '@app/components/features/tile/game-editor-tile.component';
import { GameEditorToolbarComponent } from '@app/components/features/toolbar/game-editor-toolbar.component';
import { TileSizeProbeDirective } from '@app/directives/tile-size-probe.directive';

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

    // eslint-disable-next-line max-params
    constructor(
        private readonly activatedRoute: ActivatedRoute,
        readonly gameEditorStoreService: GameEditorStoreService,
        readonly gameEditorCheckService: GameEditorCheckService,
        private readonly notificationService: NotificationService,
        private readonly screenshotService: ScreenshotService,
        private readonly gameEditorInteractionsService: GameEditorInteractionsService,
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

    async onSave(): Promise<void> {
        if (this.gameEditorCheckService.canSave()) {
            const gridPreviewImage = await this.screenshotService.captureElementAsBase64(this.gridWrapper.nativeElement);
            this.gameEditorStoreService.saveGame(gridPreviewImage);
            this.notificationService.displaySuccess({
                title: 'Jeu sauvegardé',
                message: 'Votre jeu a été sauvegardé avec succès !',
                redirectRoute: ROUTES.gameManagement,
            });
        } else {
            this.notificationService.displayError({
                title: 'Problèmes dans la carte',
                message: 'Veuillez corriger les problèmes dans la carte avant de sauvegarder.',
            });
        }
    }
}
