import { InGameSession } from '@common/interfaces/session.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class PlayerLeftInGameSessionDto {
    @ApiProperty()
    session: InGameSession;

    @ApiProperty()
    @IsString()
    playerName: string;

    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsBoolean()
    sessionEnded: boolean;

    @ApiProperty()
    @IsBoolean()
    adminModeDeactivated: boolean;
}
