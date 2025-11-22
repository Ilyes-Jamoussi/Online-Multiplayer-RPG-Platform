import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GameMode } from '@common/enums/game-mode.enum';
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

    @ApiProperty()
    @IsString()
    chatId: string;

    @ApiProperty({ enum: GameMode, enumName: 'GameMode' })
    @IsEnum(GameMode)
    mode: GameMode;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    modifiedPlayerName?: string;
}
