import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { PlayerDto } from './player.dto';

export class JoinSessionDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty({ type: PlayerDto })
    @ValidateNested()
    @Type(() => PlayerDto)
    readonly player: PlayerDto;
}

export class SessionJoinedDto {
    @ApiProperty()
    @IsString()
    gameId: string;

    @ApiProperty()
    @IsNumber()
    maxPlayers: number;
}
