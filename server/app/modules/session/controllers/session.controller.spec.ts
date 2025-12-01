import { Test, TestingModule } from '@nestjs/testing';
import { AddVirtualPlayerDto } from '@app/modules/session/dto/add-virtual-player.dto';
import { PlayerNameUpdatedDto } from '@app/modules/session/dto/player-name-updated.dto';
import { SessionPlayersUpdatedDto } from '@app/modules/session/dto/update-session.dto';
import { KickPlayerDto } from '@app/modules/session/dto/kick-player.dto';
import { LeaveSessionDto } from '@app/modules/session/dto/leave-session.dto';
import { AvailableSessionsUpdatedDto } from '@app/modules/session/dto/available-sessions-updated.dto';
import { JoinSessionDto, SessionJoinedDto } from '@app/modules/session/dto/join-session.dto';
import { AvatarAssignmentDto } from '@app/modules/session/dto/avatar-assignment.dto';
import { UpdateAvatarAssignmentsDto, AvatarAssignmentsUpdatedDto } from '@app/modules/session/dto/update-avatar-assignments.dto';
import { SessionEndedDto } from '@app/modules/session/dto/session-ended.dto';
import { CreateSessionDto, SessionCreatedDto } from '@app/modules/session/dto/create-session.dto';
import { PlayerDto } from '@app/modules/session/dto/player.dto';
import { JoinAvatarSelectionDto, AvatarSelectionJoinedDto } from '@app/modules/session/dto/join-avatar-selection';
import { SessionController } from './session.controller';

describe('SessionController', () => {
    let controller: SessionController;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SessionController],
        }).compile();

        controller = module.get<SessionController>(SessionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should handle addVirtualPlayer', () => {
        const data = {} as AddVirtualPlayerDto;
        expect(() => controller.addVirtualPlayer(data)).not.toThrow();
    });

    it('should handle playerNameUpdated', () => {
        const data = {} as PlayerNameUpdatedDto;
        expect(() => controller.playerNameUpdated(data)).not.toThrow();
    });

    it('should handle sessionPlayersUpdated', () => {
        const data = {} as SessionPlayersUpdatedDto;
        expect(() => controller.sessionPlayersUpdated(data)).not.toThrow();
    });

    it('should handle kickPlayer', () => {
        const data = {} as KickPlayerDto;
        expect(() => controller.kickPlayer(data)).not.toThrow();
    });

    it('should handle leaveSession', () => {
        const data = {} as LeaveSessionDto;
        expect(() => controller.leaveSession(data)).not.toThrow();
    });

    it('should handle availableSessionsUpdated', () => {
        const data = {} as AvailableSessionsUpdatedDto;
        expect(() => controller.availableSessionsUpdated(data)).not.toThrow();
    });

    it('should handle joinSession', () => {
        const data = {} as JoinSessionDto;
        expect(() => controller.joinSession(data)).not.toThrow();
    });

    it('should handle sessionJoined', () => {
        const data = {} as SessionJoinedDto;
        expect(() => controller.sessionJoined(data)).not.toThrow();
    });

    it('should handle avatarAssignment', () => {
        const data = {} as AvatarAssignmentDto;
        expect(() => controller.avatarAssignment(data)).not.toThrow();
    });

    it('should handle updateAvatarAssignments', () => {
        const data = {} as UpdateAvatarAssignmentsDto;
        expect(() => controller.updateAvatarAssignments(data)).not.toThrow();
    });

    it('should handle avatarAssignmentsUpdated', () => {
        const data = {} as AvatarAssignmentsUpdatedDto;
        expect(() => controller.avatarAssignmentsUpdated(data)).not.toThrow();
    });

    it('should handle sessionEnded', () => {
        const data = {} as SessionEndedDto;
        expect(() => controller.sessionEnded(data)).not.toThrow();
    });

    it('should handle createSession', () => {
        const data = {} as CreateSessionDto;
        expect(() => controller.createSession(data)).not.toThrow();
    });

    it('should handle sessionCreated', () => {
        const data = {} as SessionCreatedDto;
        expect(() => controller.sessionCreated(data)).not.toThrow();
    });

    it('should handle player', () => {
        const data = {} as PlayerDto;
        expect(() => controller.player(data)).not.toThrow();
    });

    it('should handle joinAvatarSelection', () => {
        const data = {} as JoinAvatarSelectionDto;
        expect(() => controller.joinAvatarSelection(data)).not.toThrow();
    });

    it('should handle avatarSelectionJoined', () => {
        const data = {} as AvatarSelectionJoinedDto;
        expect(() => controller.avatarSelectionJoined(data)).not.toThrow();
    });
});

