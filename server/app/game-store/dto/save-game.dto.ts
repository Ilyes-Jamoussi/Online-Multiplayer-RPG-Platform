// server/src/games/dto/save-game.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { CreateTileDto, CreatePlaceableDto } from './create-game.dto';

export class SaveTileDto extends CreateTileDto {
    @ApiPropertyOptional({
        description: 'Sub-document ID (when editing). Omit for a newly created tile.',
        example: '66e6a8c9f2d3a1b7c8e9f012',
    })
    @IsOptional()
    @IsString()
    id?: string;
}

export class SavePlaceableDto extends CreatePlaceableDto {
    @ApiPropertyOptional({
        description: 'Sub-document ID (when editing). Omit for a newly created object.',
        example: '66e6a8c9f2d3a1b7c8e9f012',
    })
    @IsOptional()
    @IsString()
    id?: string;
}

export class SaveGameDto {
    @ApiPropertyOptional({
        description: 'Game ID when saving an edit; omitted/ignored for creation.',
        example: '66e6a8c9f2d3a1b7c8e9f012',
    })
    @IsOptional()
    @IsString()
    id?: string;

    @ApiProperty({ enum: MapSize })
    @IsEnum(MapSize)
    size: MapSize;

    @ApiProperty({ enum: GameMode })
    @IsEnum(GameMode)
    mode: GameMode;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    visibility?: boolean;

    @ApiProperty({
        type: [SaveTileDto],
        description: 'Complete list of non-BASE tiles (replaces existing).',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveTileDto)
    tiles: SaveTileDto[] = [];

    @ApiProperty({
        type: [SavePlaceableDto],
        description: 'Complete list of placed objects (replaces existing).',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SavePlaceableDto)
    objects: SavePlaceableDto[] = [];
}
