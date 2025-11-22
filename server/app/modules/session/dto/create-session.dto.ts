import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { PlayerDto } from './player.dto';

export class CreateSessionDto {
    @ApiProperty()
    @IsString()
    readonly gameId: string;

    @ApiProperty()
    @IsNumber()
    readonly maxPlayers: number;

    @ApiProperty({ type: PlayerDto })
    @ValidateNested()
    @Type(() => PlayerDto)
    readonly player: PlayerDto;
}

export class SessionCreatedDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    readonly playerId: string;

    @ApiProperty()
    @IsString()
    readonly chatId: string;
}
