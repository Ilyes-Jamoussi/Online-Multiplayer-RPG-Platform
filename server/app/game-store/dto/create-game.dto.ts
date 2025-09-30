import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateGameDto {
    @ApiProperty({ enum: MapSize })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode })
    @IsEnum(GameMode)
    readonly mode: GameMode;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    readonly visibility?: boolean;
}
