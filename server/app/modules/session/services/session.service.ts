import { ACCESS_CODE_LENGTH, ACCESS_CODE_PADDING, ACCESS_CODE_RANGE } from '@app/constants/session.constants';
import { SessionPreviewDto } from '@app/modules/session/dto/available-sessions-updated.dto';
import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.interface';
import { AvatarAssignment, WaitingRoomSession } from '@common/models/session.interface';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class SessionService {
    private readonly sessions = new Map<string, WaitingRoomSession>();
    private readonly logger = new Logger(SessionService.name);

    constructor(private readonly eventEmitter: EventEmitter2) {}

    createSession(adminId: string, data: CreateSessionDto): string {
        const sessionId = this.getUniqueAccessCode();
        const session = this.buildSession(sessionId, adminId, data);
        this.sessions.set(sessionId, session);
        this.eventEmitter.emit('session.availabilityChanged');
        return sessionId;
    }

    endSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.eventEmitter.emit('session.availabilityChanged');
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
            actionsRemaining: 1,
        };
        session.players.push(player);

        if (session.players.length >= session.maxPlayers) {
            this.lock(data.sessionId);
            this.eventEmitter.emit('session.autoLocked', data.sessionId);
        }

        return uniqueName;
    }

    leaveSession(sessionId: string, playerId: string): void {
        const session = this.getSession(sessionId);
        session.players = session.players.filter((player) => player.id !== playerId);
    }

    isSessionFull(sessionId: string): boolean {
        const session = this.getSession(sessionId);
        return session.players.length >= session.maxPlayers;
    }

    getPlayersCount(sessionId: string): number {
        return this.getSession(sessionId).players.length;
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
    getPlayersData(sessionId: string): { name: string; avatar: string }[] {
        return this.sessions.get(sessionId).players.map((player) => ({
            name: player.name,
            avatar: player.avatar,
        }));
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
        this.eventEmitter.emit('session.availabilityChanged');
    }

    unlock(sessionId: string): void {
        const session = this.getSession(sessionId);
        session.isRoomLocked = false;
        this.eventEmitter.emit('session.availabilityChanged');
    }

    isRoomLocked(sessionId: string): boolean {
        return this.getSession(sessionId).isRoomLocked;
    }

    isAdmin(playerId: string): boolean {
        for (const session of this.sessions.values()) {
            const player = session.players.find((p) => p.id === playerId);
            if (player) {
                return player.isAdmin || false;
            }
        }
        return false;
    }

    kickPlayer(sessionId: string, playerId: string): void {
        const session = this.getSession(sessionId);
        session.players = session.players.filter((player) => player.id !== playerId);
    }

    getSession(sessionId: string): WaitingRoomSession {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session non trouvée');
        }
        return session;
    }

    getAvailableSessions(): SessionPreviewDto[] {
        const availableSessions = Array.from(this.sessions.values()).filter((session) => !session.isRoomLocked);
        return availableSessions.map((session) => ({
            id: session.id,
            currentPlayers: session.players.length,
            maxPlayers: session.maxPlayers,
        }));
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

    private buildSession(sessionId: string, adminId: string, data: CreateSessionDto): WaitingRoomSession {
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
            actionsRemaining: 1,
        };
        return {
            players: [adminPlayer],
            avatarAssignments: this.buildChosenAvatars(adminId, data.player.avatar),
            id: sessionId,
            gameId: data.gameId,
            maxPlayers: data.maxPlayers,
            isRoomLocked: false,
        };
    }
}
