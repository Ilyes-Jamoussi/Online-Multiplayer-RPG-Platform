import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { Avatar } from '@common/enums/avatar.enum';
import { Player } from '@common/models/player.model';
import { AvatarAssignment, Session } from '@common/models/session.model';
import { Injectable, Logger } from '@nestjs/common';
import { ACCESS_CODE_LENGTH, ACCESS_CODE_PADDING, ACCESS_CODE_RANGE } from './session.service.constants';
@Injectable()
export class SessionService {
    private readonly sessions = new Map<string, Session>();
    private readonly logger = new Logger(SessionService.name);

    createSession(adminId: string, data: CreateSessionDto): string {
        const sessionId = this.getUniqueAccessCode();
        const session = this.buildSession(sessionId, adminId, data);

        this.sessions.set(sessionId, session);

        return sessionId;
    }

    endSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    joinSession(playerId: string, data: JoinSessionDto): void {
        const player = {
            ...data.player,
            id: playerId,
            startingPoint: { x: 0, y: 0 },
        };
        this.getSession(data.sessionId).players.push(player);
    }

    leaveSession(sessionId: string, playerId: string): void {
        this.logger.log(`✅ Joueur ${playerId} retiré de la session ${sessionId}`);
        const session = this.getSession(sessionId);
        session.players = session.players.filter((player) => player.id !== playerId);
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
        this.logger.log(`[getPlayersSession] sessionId: ${sessionId}`);
        return this.getSession(sessionId).players;
    }
    getPlayersData(sessionId: string): { name: string; avatar: string }[] {
        return this.sessions.get(sessionId).players.map((player) => ({
            name: player.name,
            avatar: player.avatar,
        }));
    }

    debugSessions(): void {
        this.logger.log('Current sessions content:');
        for (const [sessionId, session] of this.sessions.entries()) {
            this.logger.log(`Session ID: ${sessionId}`);
            session.players.forEach((player) => {
                this.logger.log(`   Player socket: ${player.id}, name: ${player.name}, avatar: ${player.avatar}, isAdmin: ${player.isAdmin}`);
            });
        }
    }

    chooseAvatar(sessionId: string, playerId: string, avatarId: string): void {
        this.releaseAvatar(sessionId, playerId);
        this.selectAvatar(sessionId, playerId, avatarId);
    }

    getChosenAvatars(sessionId: string): AvatarAssignment[] {
        const session = this.getSession(sessionId);
        return session.avatarAssignments;
    }

    lock(sessionId: string): void {
        const session = this.getSession(sessionId);
        session.isRoomLocked = true;
    }

    unlock(sessionId: string): void {
        const session = this.getSession(sessionId);
        session.isRoomLocked = false;
    }

    isRoomLocked(sessionId: string): boolean {
        return this.getSession(sessionId).isRoomLocked;
    }

    private getSession(sessionId: string): Session | undefined {
        return this.sessions.get(sessionId);
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

    private releaseAvatar(sessionId: string, playerId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        for (const avatar of session.avatarAssignments) {
            if (avatar.chosenBy === playerId) {
                avatar.chosenBy = null;
                break;
            }
        }
    }

    private selectAvatar(sessionId: string, playerId: string, avatarName: string): void {
        const session = this.sessions.get(sessionId);

        const avatar = session.avatarAssignments.find((a) => a.avatar === avatarName);
        avatar.chosenBy = playerId;
    }

    private buildChosenAvatars(adminId: string, adminAvatar: Avatar): AvatarAssignment[] {
        return Object.values(Avatar).map((avatarName) => {
            const isChosen = avatarName === adminAvatar;
            return {
                avatar: avatarName,
                chosenBy: isChosen ? adminId : null,
            };
        });
    }

    private buildSession(sessionId: string, adminId: string, data: CreateSessionDto): Session {
        const adminPlayer = {
            ...data.player,
            id: adminId,
            startingPoint: { x: 0, y: 0 },
        };
        return {
            players: [adminPlayer],
            avatarAssignments: this.buildChosenAvatars(adminId, data.player.avatar),
            id: sessionId,
            isRoomLocked: false,
            gameInitializationData: {
                map: data.map,
                itemContainers: data.itemContainers,
                mapSize: data.mapSize,
            },
        };
    }
}
