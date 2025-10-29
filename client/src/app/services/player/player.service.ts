import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { DEFAULT_PLAYER } from '@app/constants/player.constants';
import { ROUTES } from '@common/enums/routes.enum';
import { NotificationService } from '@app/services/notification/notification.service';
import { SessionService } from '@app/services/session/session.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { Avatar } from '@common/enums/avatar.enum';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';
import { Character } from '@common/interfaces/character.interface';
import { Player } from '@common/models/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private readonly _player: WritableSignal<Player> = signal<Player>({ ...DEFAULT_PLAYER });
    private readonly _character = signal<Character | null>(null);

    readonly player: Signal<Player> = this._player.asReadonly();
    readonly character = this._character.asReadonly();
    readonly id: Signal<string> = computed(() => this.player().id);
    readonly isAdmin: Signal<boolean> = computed(() => this.player().isAdmin);
    readonly avatar: Signal<Avatar | null> = computed(() => this.player().avatar);

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    // Getters pour les stats calculées dynamiquement
    get lifePoints(): number {
        const char = this._character();
        if (!char) return CHARACTER_BASE;
        return char.bonus === BonusType.Life ? CHARACTER_BASE + CHARACTER_PLUS : CHARACTER_BASE;
    }

    get speedPoints(): number {
        const char = this._character();
        if (!char) return CHARACTER_BASE;
        return char.bonus === BonusType.Speed ? CHARACTER_BASE + CHARACTER_PLUS : CHARACTER_BASE;
    }

    get attackPoints(): number {
        return CHARACTER_BASE;
    }

    get defensePoints(): number {
        return CHARACTER_BASE;
    }

    get attackDice(): Dice {
        const char = this._character();
        return char?.diceAssignment.attack || Dice.D4;
    }

    get defenseDice(): Dice {
        const char = this._character();
        return char?.diceAssignment.defense || Dice.D6;
    }

    get characterName(): string {
        return this.player().name;
    }

    get remainingMovementPoints(): number {
        return this.player().movementPoints;
    }

    set characterData(character: Character) {
        this._character.set(character);
        this.updatePlayer({
            name: character.name,
            avatar: character.avatar,
            speed: character.attributes.speed,
            health: character.attributes.life,
            attack: Dice[character.diceAssignment.attack],
            defense: Dice[character.diceAssignment.defense],
            x: 0,
            y: 0,
            isInGame: false,
            startPointId: '',
            movementPoints: 0,
        });
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    resetPlayer(): void {
        this._player.set({ ...DEFAULT_PLAYER });
        this._character.set(null);
    }

    selectAvatar(avatar: Avatar): void {
        this.updatePlayer({ avatar });
        this.sessionService.updateAvatarAssignment(this.id(), avatar, this.isAdmin());
    }

    createSession(): void {
        this.sessionService.createSession(this.player());
    }

    joinAvatarSelection(sessionId: string): void {
        this.sessionService.joinAvatarSelection(sessionId);
    }

    joinSession(): void {
        this.sessionService.joinSession(this.player());
    }

    leaveSession(): void {
        this.resetPlayer();
        this.sessionService.leaveSession();
    }

    leaveAvatarSelection(): void {
        if (!this.isAdmin()) {
            this.sessionService.leaveAvatarSelection();
        }

        this.resetPlayer();
        this.sessionService.resetSession();
    }

    private initListeners(): void {
        this.sessionSocketService.onSessionCreated((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId });
            this.router.navigate([ROUTES.WaitingRoomPage]);
        });

        this.sessionSocketService.onSessionEnded((message) => {
            this.resetPlayer();
            this.sessionService.resetSession();
            this.notificationService.displayError({
                title: 'Session terminée',
                message,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.sessionSocketService.onAvatarSelectionJoined((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId });
            this.router.navigate([ROUTES.CharacterCreationPage]);
        });

        this.sessionSocketService.onSessionJoined((data) => {
            if (data.modifiedPlayerName) this.updatePlayer({ name: data.modifiedPlayerName });
            this.sessionService.handleSessionJoined({ gameId: data.gameId, maxPlayers: data.maxPlayers });
        });
    }
}
