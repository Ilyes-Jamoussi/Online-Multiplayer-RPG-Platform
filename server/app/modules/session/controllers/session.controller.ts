import { Controller, Post, Body } from '@nestjs/common';
import { PlayerNameUpdatedDto } from '../dto/player-name-updated.dto';
import { SessionPlayersUpdatedDto } from '../dto/update-session.dto';
import { KickPlayerDto } from '../dto/kick-player.dto';
import { LeaveSessionDto } from '../dto/leave-session.dto';
import { AvailableSessionsUpdatedDto } from '../dto/available-sessions-updated.dto';
import { JoinSessionDto, SessionJoinedDto } from '../dto/join-session.dto';
import { AvatarAssignmentDto } from '../dto/avatar-assignment.dto';
import { UpdateAvatarAssignmentsDto, AvatarAssignmentsUpdatedDto } from '../dto/update-avatar-assignments.dto';
import { SessionEndedDto } from '../dto/session-ended.dto';
import { CreateSessionDto, SessionCreatedDto } from '../dto/create-session.dto';
import { PlayerDto } from '../dto/player.dto';
import { JoinAvatarSelectionDto, AvatarSelectionJoinedDto } from '../dto/join-avatar-selection';

@Controller('session')
export class SessionController {
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
