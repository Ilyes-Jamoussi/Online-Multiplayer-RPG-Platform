import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class GamePreviewDto {
    @ApiProperty()
    @IsString()
    @IsMongoId()
    readonly id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ enum: MapSize })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode })
    @IsEnum(GameMode)
    readonly mode: GameMode;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty()
    @IsDateString()
    readonly lastModified: Date;

    @ApiProperty()
    @IsBoolean()
    readonly visibility: boolean;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly gridPreviewUrl: string;

    @ApiProperty()
    @IsBoolean()
    readonly draft: boolean;
}
