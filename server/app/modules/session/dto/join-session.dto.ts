import { Player } from '@common/models/player.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinSessionDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    readonly player: Player;
}
