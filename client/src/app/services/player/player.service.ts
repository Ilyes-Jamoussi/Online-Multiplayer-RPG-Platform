import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { DEFAULT_PLAYER } from '@app/constants/player.constants';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';
import { ROUTES } from '@common/enums/routes.enum';
import { Player } from '@common/models/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private readonly _player: WritableSignal<Player> = signal<Player>({ ...DEFAULT_PLAYER });

    readonly player: Signal<Player> = this._player.asReadonly();
    readonly id: Signal<string> = computed(() => this.player().id);
    readonly isAdmin: Signal<boolean> = computed(() => this.player().isAdmin);
    readonly avatar: Signal<Avatar | null> = computed(() => this.player().avatar);

    // Computed properties matching Player interface exactly
    readonly name = computed(() => this.player().name);
    readonly health = computed(() => this.player().health);
    readonly maxHealth = computed(() => this.player().maxHealth);
    readonly baseSpeed = computed(() => this.player().baseSpeed);
    readonly speedBonus = computed(() => this.player().speedBonus);
    readonly speed = computed(() => this.player().speed);
    readonly attack = computed(() => this.player().attack);
    readonly defense = computed(() => this.player().defense);
    readonly attackDice = computed(() => this.player().attackDice);
    readonly defenseDice = computed(() => this.player().defenseDice);
    readonly actionsRemaining = computed(() => this.player().actionsRemaining);
    readonly isLifeBonusSelected = computed(() => this.player().healthBonus > 0);
    readonly isSpeedBonusSelected = computed(() => this.player().speedBonus > 0);

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly inGameSocketService: InGameSocketService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    setName(name: string): void {
        this.updatePlayer({ name });
    }

    setBonus(bonus: BonusType): void {
        const baseHealth = CHARACTER_BASE;
        const healthBonus = bonus === BonusType.Life ? CHARACTER_PLUS : 0;
        const baseSpeed = CHARACTER_BASE;
        const speedBonus = bonus === BonusType.Speed ? CHARACTER_PLUS : 0;

        this.updatePlayer({
            baseHealth,
            healthBonus,
            health: baseHealth + healthBonus,
            maxHealth: baseHealth + healthBonus,
            baseSpeed,
            speedBonus,
            speed: baseSpeed + speedBonus,
        });
    }

    setDice(attr: 'attack' | 'defense', value: Dice): void {
        const newDice = {
            attackDice: attr === 'attack' ? value : (value === Dice.D6 ? Dice.D4 : Dice.D6),
            defenseDice: attr === 'defense' ? value : (value === Dice.D6 ? Dice.D4 : Dice.D6)
        };

        this.updatePlayer({
            attackDice: newDice.attackDice,
            defenseDice: newDice.defenseDice,
        });
    }

    generateRandom(): void {
        const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Samwise', 'Boromir', 'Faramir', 'Eowyn', 'Arwen'];
        const avatars = Object.values(Avatar);
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        const RANDOM_THRESHOLD = 0.5;
        const randomBonus = Math.random() < RANDOM_THRESHOLD ? BonusType.Life : BonusType.Speed;

        this.setName(randomName);
        this.selectAvatar(randomAvatar);
        this.setBonus(randomBonus);
        this.setDice(Math.random() < RANDOM_THRESHOLD ? 'attack' : 'defense', Dice.D6);
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    resetPlayer(): void {
        this._player.set({ ...DEFAULT_PLAYER });
    }

    selectAvatar(avatar: Avatar) {
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

        this.inGameSocketService.onPlayerUpdated((updatedPlayer) => {
            if (updatedPlayer.id === this.id()) {
                this.updatePlayer(updatedPlayer);
            }
        });
    }
}
