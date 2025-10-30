import { Injectable, computed, signal, inject } from '@angular/core';
import { DEFAULT_IN_GAME_SESSION } from '@app/constants/session.constants';
import { ROUTES } from '@common/enums/routes.enum';
import { DEFAULT_TURN_DURATION, DEFAULT_TURN_TRANSITION_DURATION } from '@common/constants/in-game';
import { InGameSession } from '@common/models/session.interface';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGamePlayer } from '@common/models/player.interface';
import { CombatService } from '@app/services/combat/combat.service';
import { TimerService } from '@app/services/timer/timer.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { Orientation } from '@common/enums/orientation.enum';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { AvailableAction } from '@common/interfaces/available-action.interface';

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    private readonly _inGameSession = signal<InGameSession>(DEFAULT_IN_GAME_SESSION);
    private readonly _isTransitioning = signal<boolean>(false);
    private readonly _isGameStarted = signal<boolean>(false);
    private readonly _reachableTiles = signal<ReachableTile[]>([]);
    private readonly _availableActions = signal<AvailableAction[]>([]);
    private readonly _isActionModeActive = signal<boolean>(false);

    readonly isMyTurn = computed(() => this._inGameSession().currentTurn.activePlayerId === this.playerService.id());
    readonly currentTurn = computed(() => this._inGameSession().currentTurn);
    readonly turnNumber = computed(() => this._inGameSession().currentTurn.turnNumber);
    readonly turnOrder = computed(() => this._inGameSession().turnOrder);
    readonly startPoints = computed(() => this._inGameSession().startPoints);
    readonly mapSize = computed(() => this._inGameSession().mapSize);
    readonly mode = computed(() => this._inGameSession().mode);
    readonly isGameStarted = computed(() => this._inGameSession().isGameStarted);
    readonly isTransitioning = computed(() => this._isTransitioning());
    readonly timeRemaining = computed(() => this.timerService.turnTimeRemaining());
    readonly inGamePlayers = computed(() => this._inGameSession().inGamePlayers);
    readonly inGameSession = this._inGameSession.asReadonly();
    readonly reachableTiles = this._reachableTiles.asReadonly();
    readonly hasUsedAction = computed(() => this._inGameSession().currentTurn.hasUsedAction);

    private readonly combatService = inject(CombatService);
    readonly availableActions = this._availableActions.asReadonly();
    readonly isActionModeActive = this._isActionModeActive.asReadonly();

    sessionId(): string {
        return this.sessionService.id();
    }

    attackPlayerAction(x: number, y: number): void {
        this.inGameSocketService.attackPlayerAction(this.sessionService.id(), x, y);
    }

    toggleDoorAction(x: number, y: number): void {
        this.inGameSocketService.playerToggleDoorAction(this.sessionService.id(), x, y);
    }

    useAction(): void {
        this._inGameSession.update((session) => ({
            ...session,
            currentTurn: {
                ...session.currentTurn,
                hasUsedAction: true
            }
        }));
    }

    activateActionMode(): void {
        this._isActionModeActive.set(true);
    }

    deactivateActionMode(): void {
        this._isActionModeActive.set(false);
    }

    constructor(
        private readonly inGameSocketService: InGameSocketService,
        private readonly sessionService: SessionService,
        private readonly timerService: TimerService,
        private readonly playerService: PlayerService,
        private readonly notificationService: NotificationService,
    ) {
        this.initListeners();
    }

    get activePlayer(): InGamePlayer | undefined {
        return this.getPlayerByPlayerId(this.currentTurn().activePlayerId);
    }

    get currentlyInGamePlayers(): InGamePlayer[] {
        return Object.values(this.inGamePlayers()).filter((p) => p.isInGame);
    }

    get turnTransitionMessage(): string {
        return this.isMyTurn() ? "C'est ton tour !" : `C'est le tour de ${this.activePlayer?.name} !`;
    }

    getPlayerByPlayerId(playerId: string): InGamePlayer {
        return this.inGamePlayers()[playerId];
    }

    loadInGameSession(): void {
        if (this.sessionService.id()) {
            this.inGameSocketService.playerJoinInGameSession(this.sessionService.id());
        } else {
            this.reset();
            this.notificationService.displayError({
                title: 'Session non trouvée',
                message: `Vous n'êtes connecté à aucune session`,
                redirectRoute: ROUTES.HomePage,
            });
        }
    }

    leaveGame(): void {
        this.inGameSocketService.playerLeaveInGameSession(this.sessionService.id());
    }

    startGame(): void {
        this.inGameSocketService.playerStartGame(this.sessionService.id());
    }

    movePlayer(orientation: Orientation): void {
        if (!this.isMyTurn() || !this.isGameStarted()) return;
        this.inGameSocketService.playerMove(this.sessionService.id(), orientation);
    }

    endTurn(): void {
        this.inGameSocketService.playerEndTurn(this.sessionService.id());
    }

    updateInGameSession(data: InGameSession): void {
        this._inGameSession.update((inGameSession) => ({ ...inGameSession, ...data }));
    }

    updatePlayerPosition(playerId: string, x: number, y: number, speed: number): void {
        this._inGameSession.update((inGameSession) => ({
            ...inGameSession,
            inGamePlayers: { ...inGameSession.inGamePlayers, [playerId]: { ...inGameSession.inGamePlayers[playerId], x, y, speed } },
        }));
        if (this.isMyTurn()) {
            this.playerService.updatePlayer({
                x,
                y,
                speed,
            });
        }
    }

    startTurnTimer(): void {
        this.timerService.startTurnTimer(DEFAULT_TURN_DURATION);
    }

    stopTurnTimer(): void {
        this.timerService.stopTurnTimer();
    }

    startTurnTransitionTimer(): void {
        this.timerService.startTurnTimer(DEFAULT_TURN_TRANSITION_DURATION);
    }

    turnEnd(data: InGameSession): void {
        this.updateInGameSession(data);
        this.stopTurnTimer();
        this.startTurnTransitionTimer();
        this._isTransitioning.set(true);
    }

    turnTransitionEnded(): void {
        this._isTransitioning.set(false);
    }

    reset(): void {
        this.timerService.resetAllTimers();
        this._isGameStarted.set(false);
        this._isTransitioning.set(false);
        this._reachableTiles.set([]);
        this._inGameSession.set(DEFAULT_IN_GAME_SESSION);
        this.sessionService.resetSession();
        this.playerService.resetPlayer();
    }

    private initListeners(): void {
        this.inGameSocketService.onPlayerJoinedInGameSession((data) => {
            this.updateInGameSession(data);
        });

        this.inGameSocketService.onGameStarted((data) => {
            this.updateInGameSession(data);
            this.startTurnTimer();
            this._isGameStarted.set(true);
        });

        this.inGameSocketService.onTurnStarted((data) => {
            this.updateInGameSession(data);
            this.startTurnTimer();
            this._isGameStarted.set(true);
        });

        this.inGameSocketService.onTurnEnded((data) => {
            this.turnEnd(data);
        });

        this.inGameSocketService.onTurnTransitionEnded(() => {
            this.turnTransitionEnded();
        });

        this.inGameSocketService.onPlayerLeftInGameSession((data) => {
            this.updateInGameSession(data.session);
            this.notificationService.displayInformation({
                title: 'Joueur parti',
                message: `${data.playerName} a abandonné la partie`,
            });
        });

        this.inGameSocketService.onPlayerMoved((data) => {
            this.updatePlayerPosition(data.playerId, data.x, data.y, data.speed);
        });

        this.inGameSocketService.onLeftInGameSessionAck(() => {
            this.reset();
            this.notificationService.displayInformation({
                title: 'Départ réussi',
                message: `Tu as quitté la partie avec succès`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onGameForceStopped(() => {
            this.reset();
            this.notificationService.displayError({
                title: 'Partie terminée par défaut',
                message: `Il n'y a plus assez de joueurs pour continuer la partie, la partie est terminée`,
                redirectRoute: ROUTES.HomePage,
            });
        });

        this.inGameSocketService.onPlayerReachableTiles((data) => {
            this._reachableTiles.set(data);
        });

        this.inGameSocketService.onPlayerAvailableActions((data) => {
            this._availableActions.set(data);
        });

        this.inGameSocketService.onCombatStarted((data) => {
            this.handleCombatStarted(data.attackerId, data.targetId);
        });

        this.inGameSocketService.onCombatEnded(() => {
            this.combatService.endCombat();
        });
    }

    private handleCombatStarted(attackerId: string, targetId: string): void {
        const myId = this.playerService.id();
        const attacker = this.getPlayerByPlayerId(attackerId);
        const target = this.getPlayerByPlayerId(targetId);
        
        if (!attacker || !target) return;

        if (attackerId === myId) {
            // JE SUIS L'ATTAQUANT
            this.combatService.startCombat(attackerId, targetId, 'attacker');
            
        } else if (targetId === myId) {
            // JE SUIS LA CIBLE
            this.combatService.startCombat(attackerId, targetId, 'target');
            
        } else {
            // JE SUIS SPECTATEUR
            this.notificationService.displayInformation({
                title: 'Combat en cours',
                message: `${attacker.name} combat ${target.name}`
            });
        }
    }
}
