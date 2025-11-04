import { Injectable, OnDestroy } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Orientation } from '@common/enums/orientation.enum';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';

export enum GameKey {
    Up = 'ArrowUp',
    Down = 'ArrowDown',
    Left = 'ArrowLeft',
    Right = 'ArrowRight',
    AdminMode = 'd',
}

export interface KeyboardEventData {
    key: string;
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class InGameKeyboardEventsService implements OnDestroy {
    private isListening = false;
    private keyUpHandler?: (event: KeyboardEvent) => void;
    private keyPressHandler?: (event: KeyboardEvent) => void;

    constructor(
        private readonly inGameService: InGameService,
        private readonly adminModeService: AdminModeService,
    ) {}

    startListening(): void {
        if (this.isListening) return;

        this.isListening = true;
        this.keyUpHandler = this.handleKeyUp.bind(this);
        this.keyPressHandler = this.handleKeyPress.bind(this);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('keypress', this.keyPressHandler);
    }

    stopListening(): void {
        if (!this.isListening) return;

        this.isListening = false;

        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        if (this.keyPressHandler) {
            document.removeEventListener('keypress', this.keyPressHandler);
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        if (!this.inGameService.isMyTurn() || !this.inGameService.isGameStarted()) {
            return;
        }

        switch (event.key) {
            case GameKey.Up:
                event.preventDefault();
                this.handleMovement(Orientation.N);
                break;

            case GameKey.Down:
                event.preventDefault();
                this.handleMovement(Orientation.S);
                break;

            case GameKey.Left:
                event.preventDefault();
                this.handleMovement(Orientation.W);
                break;

            case GameKey.Right:
                event.preventDefault();
                this.handleMovement(Orientation.E);
                break;
        }
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === GameKey.AdminMode) {
            event.preventDefault();
            this.handleAdminModeToggle();
        }
    }

    private handleMovement(orientation: Orientation): void {
        this.inGameService.movePlayer(orientation);
    }

    private handleAdminModeToggle(): void {
        this.adminModeService.toggleAdminMode();
    }

    ngOnDestroy(): void {
        this.stopListening();
    }
}
