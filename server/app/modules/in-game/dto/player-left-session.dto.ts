import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { InGameSession } from '@common/interfaces/session.interface';

export class PlayerLeftSessionDto {
    @ApiProperty()
    session: InGameSession;

    @ApiProperty()
    @IsString()
    playerName: string;

    @ApiProperty()
    @IsString()
    playerId: string;
}
