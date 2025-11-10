/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function -- OpenAPI DTO generation placeholders */
import { Controller, Post, Body } from '@nestjs/common';
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

@Controller('session')
export class SessionController {
    @Post('add-virtual-player')
    addVirtualPlayer(@Body() data: AddVirtualPlayerDto): void {}

    @Post('player-name-updated')
    playerNameUpdated(@Body() data: PlayerNameUpdatedDto): void {}

    @Post('session-players-updated')
    sessionPlayersUpdated(@Body() data: SessionPlayersUpdatedDto): void {}

    @Post('kick-player')
    kickPlayer(@Body() data: KickPlayerDto): void {}

    @Post('leave-session')
    leaveSession(@Body() data: LeaveSessionDto): void {}

    @Post('available-sessions-updated')
    availableSessionsUpdated(@Body() data: AvailableSessionsUpdatedDto): void {}

    @Post('join-session')
    joinSession(@Body() data: JoinSessionDto): void {}

    @Post('session-joined')
    sessionJoined(@Body() data: SessionJoinedDto): void {}

    @Post('avatar-assignment')
    avatarAssignment(@Body() data: AvatarAssignmentDto): void {}

    @Post('update-avatar-assignments')
    updateAvatarAssignments(@Body() data: UpdateAvatarAssignmentsDto): void {}

    @Post('avatar-assignments-updated')
    avatarAssignmentsUpdated(@Body() data: AvatarAssignmentsUpdatedDto): void {}

    @Post('session-ended')
    sessionEnded(@Body() data: SessionEndedDto): void {}

    @Post('create-session')
    createSession(@Body() data: CreateSessionDto): void {}

    @Post('session-created')
    sessionCreated(@Body() data: SessionCreatedDto): void {}

    @Post('player')
    player(@Body() data: PlayerDto): void {}

    @Post('join-avatar-selection')
    joinAvatarSelection(@Body() data: JoinAvatarSelectionDto): void {}

    @Post('avatar-selection-joined')
    avatarSelectionJoined(@Body() data: AvatarSelectionJoinedDto): void {}
}
