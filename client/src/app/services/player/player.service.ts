import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BASE_STAT_VALUE, BONUS_STAT_VALUE, DEFAULT_PLAYER, RANDOM_BONUS_THRESHOLD } from '@app/constants/player.constants';
import { BonusType } from '@app/enums/character-creation.enum';
import { TeamColor } from '@app/enums/team-color.enum';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { ResetService } from '@app/services/reset/reset.service';
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
    readonly speedBonus = computed(() => this.player().speedBonus);
    readonly speed = computed(() => this.player().speed);
    readonly attackBonus = computed(() => this.player().attackBonus);
    readonly defenseBonus = computed(() => this.player().defenseBonus);
    readonly attackDice = computed(() => this.player().attackDice);
    readonly defenseDice = computed(() => this.player().defenseDice);
    readonly actionsRemaining = computed(() => this.player().actionsRemaining);
    readonly isLifeBonusSelected = computed(() => this.player().healthBonus > 0);
    readonly isSpeedBonusSelected = computed(() => this.player().speedBonus > 0);
    readonly combatCount = computed(() => this.player().combatCount);
    readonly combatWins = computed(() => this.player().combatWins);
    readonly combatLosses = computed(() => this.player().combatLosses);
    readonly combatDraws = computed(() => this.player().combatDraws);
    readonly teamNumber = computed(() => this.player().teamNumber);

    constructor(
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly inGameSocketService: InGameSocketService,
        private readonly notificationCoordinatorService: NotificationService,
        private readonly router: Router,
    ) {
        this.initListeners();
        inject(ResetService).reset$.subscribe(() => this.reset());
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
        const randomBonus = Math.random() < RANDOM_BONUS_THRESHOLD ? BonusType.Life : BonusType.Speed;

        this.setName(randomName);
        this.selectAvatar(randomAvatar);
        this.setBonus(randomBonus);
        this.setDice(Math.random() < RANDOM_BONUS_THRESHOLD ? 'attack' : 'defense', Dice.D6);
    }

    updatePlayer(partial: Partial<Player>): void {
        this._player.update((player) => ({ ...player, ...partial }));
    }

    reset(): void {
        this._player.set({ ...DEFAULT_PLAYER });
        this.sessionService.reset();
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

    boatAction(x: number, y: number): void {
        if (this.player().onBoatId) {
            this.disembarkBoat(x, y);
        } else {
            this.boardBoat(x, y);
        }
    }

    private boardBoat(x: number, y: number): void {
        this.inGameSocketService.playerBoardBoat(this.sessionService.id(), x, y);
    }

    private disembarkBoat(x: number, y: number): void {
        this.inGameSocketService.playerDisembarkBoat(this.sessionService.id(), x, y);
    }

    getTeamColor(teamNumber: number | undefined): string | undefined {
        if (teamNumber === undefined) return undefined;
        const myTeamNumber = this.teamNumber();
        if (myTeamNumber === undefined) return undefined;
        return teamNumber === myTeamNumber ? TeamColor.MyTeam : TeamColor.EnemyTeam;
    }

    private initListeners(): void {
        this.sessionSocketService.onSessionCreated((data) => {
            this.updatePlayer({ id: data.playerId });
            this.sessionService.updateSession({ id: data.sessionId, chatId: data.chatId });
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
            this.sessionService.handleSessionJoined(data);
        });

        this.inGameSocketService.onPlayerUpdated((updatedPlayer) => {
            if (updatedPlayer.id === this.id()) {
                this.updatePlayer(updatedPlayer);
            }
        });
    }
}
