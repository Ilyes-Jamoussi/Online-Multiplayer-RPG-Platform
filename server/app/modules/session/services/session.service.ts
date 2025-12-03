import { ACCESS_CODE_LENGTH, ACCESS_CODE_PADDING, ACCESS_CODE_RANGE } from '@app/constants/session.constants';
import { BASE_STAT_POINTS, BONUS_HEALTH_POINTS, RANDOM_THRESHOLD_RATIO, VIRTUAL_PLAYER_NAMES } from '@app/constants/virtual-player.constants';
import { ServerEvents } from '@app/enums/server-events.enum';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { SessionPreviewDto } from '@app/modules/session/dto/available-sessions-updated.dto';
import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { GameDocument } from '@app/types/mongoose-documents.types';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { AvatarAssignment, WaitingRoomSession } from '@common/interfaces/session.interface';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class SessionService {
    private readonly sessions = new Map<string, WaitingRoomSession>();

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly chatService: ChatService,
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    ) {}

    createSession(adminId: string, data: CreateSessionDto): { sessionId: string; chatId: string } {
        const sessionId = this.getUniqueAccessCode();
        const chatId = this.chatService.createChat();
        const session = this.buildSession(sessionId, adminId, data, chatId);
        this.sessions.set(sessionId, session);
        this.eventEmitter.emit(ServerEvents.SessionAvailabilityChanged);
        return { sessionId, chatId };
    }

    endSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.eventEmitter.emit(ServerEvents.SessionAvailabilityChanged);
    }

    joinSession(playerId: string, data: JoinSessionDto): string {
        const session = this.getSession(data.sessionId);
        const uniqueName = this.generateUniqueName(data.player.name, session.players);

        const player: Player = {
            ...data.player,
            name: uniqueName,
            id: playerId,
            x: 0,
            y: 0,
            isInGame: false,
            startPointId: '',
            combatCount: 0,
            combatWins: 0,
            combatLosses: 0,
            combatDraws: 0,
            hasCombatBonus: false,
            actionsRemaining: 1,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        };
        session.players.push(player);

        if (session.players.length >= session.maxPlayers) {
            this.lock(data.sessionId);
            this.eventEmitter.emit(ServerEvents.SessionAutoLocked, data.sessionId);
        }

        return uniqueName;
    }

    leaveSession(sessionId: string, playerId: string): void {
        const session = this.getSession(sessionId);
        session.players = session.players.filter((player) => player.id !== playerId);
        this.releaseAvatar(sessionId, playerId);

        if (session.isRoomLocked) {
            this.unlock(sessionId);
        }
    }

    isSessionFull(sessionId: string): boolean {
        const session = this.getSession(sessionId);
        return session.players.length >= session.maxPlayers;
    }

    getPlayerSessionId(playerId: string): string | null {
        for (const [sessionId, session] of this.sessions.entries()) {
            const found = [...session.players].some((player) => player.id === playerId);
            if (found) {
                return sessionId;
            }
        }
        return null;
    }

    getPlayersSession(sessionId: string): Player[] {
        return this.getSession(sessionId).players;
    }

    chooseAvatar(sessionId: string, playerId: string, avatar: Avatar): void {
        this.releaseAvatar(sessionId, playerId);
        this.selectAvatar(sessionId, playerId, avatar);
    }

    getChosenAvatars(sessionId: string): AvatarAssignment[] {
        const session = this.getSession(sessionId);
        return session.avatarAssignments;
    }

    lock(sessionId: string): void {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} introuvable`);
        }
        session.isRoomLocked = true;
        this.eventEmitter.emit(ServerEvents.SessionAvailabilityChanged);
    }

    unlock(sessionId: string): void {
        const session = this.getSession(sessionId);
        session.isRoomLocked = false;
        this.eventEmitter.emit(ServerEvents.SessionAvailabilityChanged);
    }

    isRoomLocked(sessionId: string): boolean {
        return this.getSession(sessionId).isRoomLocked;
    }

    isAdmin(playerId: string): boolean {
        for (const session of this.sessions.values()) {
            const player = session.players.find((candidate) => candidate.id === playerId);
            if (player) {
                return player.isAdmin || false;
            }
        }
        return false;
    }

    kickPlayer(sessionId: string, playerId: string): void {
        const session = this.getSession(sessionId);
        session.players = session.players.filter((player) => player.id !== playerId);
        this.releaseAvatar(sessionId, playerId);

        if (session.isRoomLocked) {
            this.unlock(sessionId);
        }
    }

    addVirtualPlayer(sessionId: string, virtualPlayerType: VirtualPlayerType): Player[] {
        const session = this.getSession(sessionId);
        const virtualPlayer = this.createVirtualPlayer(virtualPlayerType, session.players);
        session.players.push(virtualPlayer);
        this.selectAvatar(sessionId, virtualPlayer.id, virtualPlayer.avatar);

        if (session.players.length >= session.maxPlayers) {
            this.lock(sessionId);
            this.eventEmitter.emit(ServerEvents.SessionAutoLocked, sessionId);
        }

        return session.players;
    }

    private createVirtualPlayer(virtualPlayerType: VirtualPlayerType, existingPlayers: Player[]): Player {
        const availableNames = VIRTUAL_PLAYER_NAMES.filter((botName) => !existingPlayers.some((player) => player.name === botName));
        const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Bot-${Date.now()}`;

        const avatars = Object.values(Avatar);
        const availableAvatars = avatars.filter((botAvatar) => !existingPlayers.some((player) => player.avatar === botAvatar));
        const avatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];

        const attackDice = Math.random() > RANDOM_THRESHOLD_RATIO ? Dice.D4 : Dice.D6;
        const defenseDice = attackDice === Dice.D4 ? Dice.D6 : Dice.D4;

        const healthBonus = Math.random() > RANDOM_THRESHOLD_RATIO ? BONUS_HEALTH_POINTS : 0;
        const speedBonus = healthBonus === BONUS_HEALTH_POINTS ? 0 : BONUS_HEALTH_POINTS;

        return {
            id: `virtual-${Date.now()}-${Math.random()}`,
            name,
            avatar,
            isAdmin: false,
            baseHealth: BASE_STAT_POINTS,
            healthBonus,
            health: BASE_STAT_POINTS + healthBonus,
            maxHealth: BASE_STAT_POINTS + healthBonus,
            baseSpeed: BASE_STAT_POINTS,
            speedBonus,
            speed: BASE_STAT_POINTS + speedBonus,
            baseAttack: BASE_STAT_POINTS,
            attackBonus: 0,
            baseDefense: BASE_STAT_POINTS,
            defenseBonus: 0,
            attackDice,
            defenseDice,
            x: 0,
            y: 0,
            isInGame: false,
            startPointId: '',
            actionsRemaining: 1,
            combatCount: 0,
            combatWins: 0,
            combatLosses: 0,
            combatDraws: 0,
            hasCombatBonus: false,
            virtualPlayerType,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        };
    }

    getSession(sessionId: string): WaitingRoomSession {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session non trouvée');
        }
        return session;
    }

    async getAvailableSessions(): Promise<SessionPreviewDto[]> {
        const availableSessions = Array.from(this.sessions.values()).filter((session) => !session.isRoomLocked);

        const sessionsWithGameInfo = await Promise.all(
            availableSessions.map(async (session) => {
                const gameInfo = await this.getGameInfo(session.gameId);
                return {
                    id: session.id,
                    currentPlayers: session.players.length,
                    maxPlayers: session.maxPlayers,
                    gameName: gameInfo.name,
                    gameDescription: gameInfo.description,
                    mapSize: gameInfo.size,
                    gameMode: gameInfo.mode,
                };
            }),
        );

        return sessionsWithGameInfo;
    }

    private async getGameInfo(gameId: string) {
        const game = await this.gameModel.findById(gameId, 'name description size mode').lean();
        return game;
    }

    releaseAvatar(sessionId: string, playerId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        for (const avatar of session.avatarAssignments) {
            if (avatar.chosenBy === playerId) {
                avatar.chosenBy = null;
                break;
            }
        }
    }

    private getUniqueAccessCode(): string {
        let accessCode: string;
        do {
            accessCode = this.generateAccessCode();
        } while (this.isSessionIdInUse(accessCode));
        return accessCode;
    }

    private generateAccessCode(): string {
        return Math.floor(Math.random() * ACCESS_CODE_RANGE)
            .toString()
            .padStart(ACCESS_CODE_LENGTH, ACCESS_CODE_PADDING);
    }

    private isSessionIdInUse(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    private buildChosenAvatars(adminId: string, adminAvatar: Avatar): AvatarAssignment[] {
        return Object.values(Avatar).map((avatar) => {
            const isChosen = avatar === adminAvatar;
            return {
                avatar,
                chosenBy: isChosen ? adminId : null,
            };
        });
    }

    private selectAvatar(sessionId: string, playerId: string, avatar: Avatar): void {
        const session = this.sessions.get(sessionId);

        const selectedAvatar = session.avatarAssignments.find((a) => a.avatar === avatar);
        selectedAvatar.chosenBy = playerId;
    }

    private generateUniqueName(baseName: string, existingPlayers: Player[]): string {
        const existingNames = existingPlayers.map((player) => player.name);

        if (!existingNames.includes(baseName)) {
            return baseName;
        }

        let counter = 2;
        let uniqueName = `${baseName}-${counter}`;

        while (existingNames.includes(uniqueName)) {
            counter++;
            uniqueName = `${baseName}-${counter}`;
        }

        return uniqueName;
    }

    private buildSession(sessionId: string, adminId: string, data: CreateSessionDto, chatId: string): WaitingRoomSession {
        const adminPlayer: Player = {
            ...data.player,
            id: adminId,
            x: 0,
            y: 0,
            isInGame: false,
            startPointId: '',
            combatCount: 0,
            combatWins: 0,
            combatLosses: 0,
            combatDraws: 0,
            hasCombatBonus: false,
            actionsRemaining: 1,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        };
        return {
            players: [adminPlayer],
            avatarAssignments: this.buildChosenAvatars(adminId, data.player.avatar),
            id: sessionId,
            gameId: data.gameId,
            maxPlayers: data.maxPlayers,
            mode: data.mode,
            isRoomLocked: false,
            chatId,
        };
    }
}
