import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { BASE_STAT_VALUE, BONUS_STAT_VALUE, DEFAULT_PLAYER } from '@app/constants/player.constants';
import { BonusType } from '@app/enums/character-creation.enum';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    private readonly _player: WritableSignal<Player> = signal<Player>({ ...DEFAULT_PLAYER });

    readonly player: Signal<Player> = this._player.asReadonly();
    readonly id: Signal<string> = computed(() => this.player().id);
    readonly isAdmin: Signal<boolean> = computed(() => this.player().isAdmin);
    readonly avatar: Signal<Avatar | null> = computed(() => this.player().avatar);

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
    readonly combatCount = computed(() => this.player().combatCount);
    readonly combatWins = computed(() => this.player().combatWins);
    readonly combatLosses = computed(() => this.player().combatLosses);
    readonly combatDraws = computed(() => this.player().combatDraws);

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly inGameSocketService: InGameSocketService,
        private readonly notificationCoordinatorService: NotificationCoordinatorService,
        private readonly router: Router,
    ) {
        this.initListeners();
    }

    setName(name: string): void {
        this.updatePlayer({ name });
    }

    setBonus(bonus: BonusType): void {
        const baseHealth = BASE_STAT_VALUE;
        const healthBonus = bonus === BonusType.Life ? BONUS_STAT_VALUE : 0;
        const baseSpeed = BASE_STAT_VALUE;
        const speedBonus = bonus === BonusType.Speed ? BONUS_STAT_VALUE : 0;

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
        const otherDiceValue = value === Dice.D6 ? Dice.D4 : Dice.D6;

        const newDice = {
            attackDice: attr === 'attack' ? value : otherDiceValue,
            defenseDice: attr === 'defense' ? value : otherDiceValue,
        };

        this.updatePlayer({
            attackDice: newDice.attackDice,
            defenseDice: newDice.defenseDice,
        });
    }

    generateRandom(): void {
        const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Samwise', 'Boromir', 'Faramir', 'Eowyn', 'Arwen'];
        const availableAvatars = this.sessionService
            .avatarAssignments()
            .filter((assignment) => assignment.chosenBy === null)
            .map((assignment) => assignment.avatar);

        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
        const randomThreshold = 0.5;
        const randomBonus = Math.random() < randomThreshold ? BonusType.Life : BonusType.Speed;

        this.setName(randomName);
        this.selectAvatar(randomAvatar);
        this.setBonus(randomBonus);
        this.setDice(Math.random() < randomThreshold ? 'attack' : 'defense', Dice.D6);
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    reset(): void {
        this._player.set({ ...DEFAULT_PLAYER });
        this.sessionService.resetSession();
    }

    setAsAdmin(): void {
        this.updatePlayer({ isAdmin: true });
    }

    setAsGuest(): void {
        this.updatePlayer({ isAdmin: false });
    }

    isConnected(): boolean {
        return this.sessionService.id() !== '';
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
        this.sessionService.leaveSession();
    }

    leaveAvatarSelection(): void {
        if (!this.isAdmin()) {
            this.sessionService.leaveAvatarSelection();
        }
    }

    updateActionsRemaining(actionsRemaining: number): void {
        this.updatePlayer({ actionsRemaining });
    }

    private initListeners(): void {
        this.sessionSocketService.onSessionCreated((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId });
            void this.router.navigate([ROUTES.WaitingRoomPage]);
        });

        this.sessionSocketService.onSessionEnded((message) => {
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Session terminée',
                message,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.sessionSocketService.onAvatarSelectionJoined((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId });
            void this.router.navigate([ROUTES.CharacterCreationPage]);
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
