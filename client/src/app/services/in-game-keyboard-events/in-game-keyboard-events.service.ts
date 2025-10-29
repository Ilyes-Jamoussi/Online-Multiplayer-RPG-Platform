import { Injectable, OnDestroy } from '@angular/core';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Orientation } from '@common/enums/orientation.enum';

export enum GameKey {
    Up = 'ArrowUp',
    Down = 'ArrowDown',
    Left = 'ArrowLeft',
    Right = 'ArrowRight',
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
    private keyDownHandler?: (event: KeyboardEvent) => void;

    constructor(private readonly inGameService: InGameService) {}

    startListening(): void {
        if (this.isListening) return;

        this.isListening = true;
        this.keyDownHandler = this.handleKeyUp.bind(this);

        document.addEventListener('keyup', this.keyDownHandler);
    }

    stopListening(): void {
        if (!this.isListening) return;

        this.isListening = false;

        if (this.keyDownHandler) {
            document.removeEventListener('keyup', this.keyDownHandler);
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

    private handleMovement(orientation: Orientation): void {
        this.inGameService.movePlayer(orientation);
    }

    ngOnDestroy(): void {
        this.stopListening();
    }
}
