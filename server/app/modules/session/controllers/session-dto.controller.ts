import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailableSessionsUpdatedDto } from '../dto/available-sessions-updated.dto';
import { CreateSessionDto, SessionCreatedDto } from '../dto/create-session.dto';
import { AvatarSelectionJoinedDto, JoinAvatarSelectionDto } from '../dto/join-avatar-selection';
import { JoinSessionDto, SessionJoinedDto } from '../dto/join-session.dto';
import { KickPlayerDto } from '../dto/kick-player.dto';
import { LeaveSessionDto, SessionLeftDto } from '../dto/leave-session.dto';
import { PlayerDto } from '../dto/player.dto';
import { SessionEndedDto } from '../dto/session-ended.dto';
import { AvatarAssignmentsUpdatedDto, UpdateAvatarAssignmentsDto } from '../dto/update-avatar-assignments.dto';
import { SessionPlayersUpdatedDto } from '../dto/update-session.dto';

@ApiTags('Session DTOs (temporary for generation)')
@Controller('session-dto')
export class SessionDtoController {
    @Post('create-session')
    @ApiOperation({ summary: 'DTO for CreateSession' })
    createSession(@Body() dto: CreateSessionDto): void {}

    @Post('session-created')
    @ApiOperation({ summary: 'DTO for SessionCreated' })
    sessionCreated(@Body() dto: SessionCreatedDto): void {}

    @Post('join-session')
    @ApiOperation({ summary: 'DTO for JoinSession' })
    joinSession(@Body() dto: JoinSessionDto): void {}

    @Post('session-joined')
    @ApiOperation({ summary: 'DTO for SessionJoined' })
    sessionJoined(@Body() dto: SessionJoinedDto): void {}

    @Post('update-avatar-assignments')
    @ApiOperation({ summary: 'DTO for UpdateAvatarAssignments' })
    updateAvatarAssignments(@Body() dto: UpdateAvatarAssignmentsDto): void {}

    @Post('avatar-assignments-updated')
    @ApiOperation({ summary: 'DTO for AvatarAssignmentsUpdated' })
    avatarAssignmentsUpdated(@Body() dto: AvatarAssignmentsUpdatedDto): void {}

    @Post('join-avatar-selection')
    @ApiOperation({ summary: 'DTO for JoinAvatarSelection' })
    joinAvatarSelection(@Body() dto: JoinAvatarSelectionDto): void {}

    @Post('avatar-selection-joined')
    @ApiOperation({ summary: 'DTO for AvatarSelectionJoined' })
    avatarSelectionJoined(@Body() dto: AvatarSelectionJoinedDto): void {}

    @Post('leave-session')
    @ApiOperation({ summary: 'DTO for LeaveSession' })
    leaveSession(@Body() dto: LeaveSessionDto): void {}

    @Post('session-left')
    @ApiOperation({ summary: 'DTO for SessionLeft' })
    sessionLeft(@Body() dto: SessionLeftDto): void {}

    @Post('session-players-updated')
    @ApiOperation({ summary: 'DTO for SessionPlayersUpdated' })
    sessionPlayersUpdated(@Body() dto: SessionPlayersUpdatedDto): void {}

    @Post('player')
    @ApiOperation({ summary: 'DTO for Player' })
    player(@Body() dto: PlayerDto): void {}

    @Post('kick-player')
    @ApiOperation({ summary: 'DTO for KickPlayer' })
    kickPlayer(@Body() dto: KickPlayerDto): void {}

    @Post('session-ended')
    @ApiOperation({ summary: 'DTO for SessionEnded' })
    sessionEnded(@Body() dto: SessionEndedDto): void {}

    @Post('available-sessions-updated')
    @ApiOperation({ summary: 'DTO for AvailableSessionsUpdated' })
    availableSessionsUpdated(@Body() dto: AvailableSessionsUpdatedDto): void {}
}
