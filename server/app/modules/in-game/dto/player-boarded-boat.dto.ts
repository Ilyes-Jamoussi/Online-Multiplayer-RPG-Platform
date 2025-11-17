import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PlayerBoardedBoatDto {
    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty()
    @IsString()
    boatId: string;
}
