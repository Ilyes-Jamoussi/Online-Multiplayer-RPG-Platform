import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateSessionDto, SessionCreatedDto } from '../dto/create-session.dto';
import { JoinSessionDto } from '../dto/join-session.dto';
import { UpdateAvatarAssignmentsDto, AvatarAssignmentsUpdatedDto } from '../dto/update-avatar-assignments.dto';
import { StartGameSessionDto } from '../dto/start-game-session.dto';
import { JoinAvatarSelectionDto, AvatarSelectionJoinedDto } from '../dto/join-avatar-selection';
import { LeaveSessionDto, SessionLeftDto } from '../dto/leave-session.dto';
import { VoidDto } from '../dto/void.dto';
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

    @Post('update-avatar-assignments')
    @ApiOperation({ summary: 'DTO for UpdateAvatarAssignments' })
    updateAvatarAssignments(@Body() dto: UpdateAvatarAssignmentsDto): void {}

    @Post('avatar-assignments-updated')
    @ApiOperation({ summary: 'DTO for AvatarAssignmentsUpdated' })
    avatarAssignmentsUpdated(@Body() dto: AvatarAssignmentsUpdatedDto): void {}

    @Post('start-game-session')
    @ApiOperation({ summary: 'DTO for StartGameSession' })
    startGameSession(@Body() dto: StartGameSessionDto): void {}

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

    @Post('void')
    @ApiOperation({ summary: 'DTO for Void' })
    void(@Body() dto: VoidDto): void {}

    @Post('session-players-updated')
    @ApiOperation({ summary: 'DTO for SessionPlayersUpdated' })
    sessionPlayersUpdated(@Body() dto: SessionPlayersUpdatedDto): void {}
}
