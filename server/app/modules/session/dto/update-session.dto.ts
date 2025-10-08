import { ApiProperty } from '@nestjs/swagger';
import { PlayerDto } from './player.dto';

export class SessionPlayersUpdatedDto {
    @ApiProperty({ type: [PlayerDto] })
    players: PlayerDto[];
}
