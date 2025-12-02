import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameKey } from '@app/enums/game-key.enum';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { Orientation } from '@common/enums/orientation.enum';

@Component({
    selector: 'app-game-map-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map-footer.component.html',
    styleUrl: './game-map-footer.component.scss',
})
export class GameMapFooterComponent implements OnInit, OnDestroy {
    pressedKeys = new Set<string>();
    private keyDownHandler?: (event: KeyboardEvent) => void;
    private keyUpHandler?: (event: KeyboardEvent) => void;

    constructor(
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
        private readonly adminModeService: AdminModeService,
        private readonly combatService: CombatService,
        private readonly notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.keyUpHandler = this.handleKeyUp.bind(this);
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    ngOnDestroy(): void {
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const key = event.key;
        if (key === GameKey.Up || key === GameKey.Down || key === GameKey.Left || key === GameKey.Right || key.toLowerCase() === GameKey.AdminMode) {
            this.pressedKeys.add(key);
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        const key = event.key;
        this.pressedKeys.delete(key);
    }

    isKeyPressed(key: string): boolean {
        return this.pressedKeys.has(key);
    }

    get remainingMovements(): number {
        return this.playerService.speed();
    }

    get boatSpeed(): number {
        return this.playerService.player().boatSpeed;
    }

    get availableActionsCount(): number {
        return this.inGameService.availableActions().length;
    }

    get isMyTurn(): boolean {
        return this.inGameService.isMyTurn();
    }

    get isGameStarted(): boolean {
        return this.inGameService.isGameStarted();
    }

    get hasUsedAction(): boolean {
        return this.inGameService.hasUsedAction();
    }

    isActionDisabled(): boolean {
        return !this.isMyTurn || !this.isGameStarted || this.hasUsedAction || !this.hasAvailableActions();
    }

    hasAvailableActions(): boolean {
        return this.inGameService.availableActions().length > 0;
    }

    get isActionModeActive(): boolean {
        return this.inGameService.isActionModeActive();
    }

    onAction(): void {
        if (this.isActionModeActive) {
            this.inGameService.deactivateActionMode();
        } else {
            this.inGameService.activateActionMode();
        }
    }

    get isAdmin(): boolean {
        return this.playerService.isAdmin();
    }

    onMoveUp(): void {
        if (this.inGameService.isMyTurn() && this.inGameService.isGameStarted()) {
            this.inGameService.movePlayer(Orientation.N);
        }
    }

    onMoveDown(): void {
        if (this.inGameService.isMyTurn() && this.inGameService.isGameStarted()) {
            this.inGameService.movePlayer(Orientation.S);
        }
    }

    onMoveLeft(): void {
        if (this.inGameService.isMyTurn() && this.inGameService.isGameStarted()) {
            this.inGameService.movePlayer(Orientation.W);
        }
    }

    onMoveRight(): void {
        if (this.inGameService.isMyTurn() && this.inGameService.isGameStarted()) {
            this.inGameService.movePlayer(Orientation.E);
        }
    }

    onToggleDebug(): void {
        if (this.isAdmin) {
            this.adminModeService.toggleAdminMode();
        }
    }

    onLeaveGame(): void {
        this.notificationService.displayConfirmationPopup({
            title: 'Abandonner la partie',
            message: 'Êtes-vous sûr de vouloir abandonner ?\nTous vos progrès seront perdus.',
            onConfirm: () => {
                this.combatService.combatAbandon();
                this.inGameService.leaveGame();
            },
        });
    }
}
