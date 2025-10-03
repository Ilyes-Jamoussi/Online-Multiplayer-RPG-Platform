import { GameSession } from '@common/models/game-session.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
export class StartGameSessionDto {
    @ApiProperty()
    @IsObject()
    readonly gameSession: GameSession;
}
