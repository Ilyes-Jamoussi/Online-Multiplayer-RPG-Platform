// server/src/games/dto/create-game.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Orientation } from '@common/enums/orientation.enum';

export class CreateTileDto {
    @ApiProperty({ minimum: 0, example: 7 })
    @IsInt()
    @Min(0)
    x: number;

    @ApiProperty({ minimum: 0, example: 12 })
    @IsInt()
    @Min(0)
    y: number;

    @ApiProperty({ enum: TileKind, example: TileKind.WALL })
    @IsEnum(TileKind)
    kind: TileKind;

    @ApiPropertyOptional({ description: 'For DOOR only', example: false })
    @IsOptional()
    @IsBoolean()
    open?: boolean;

    @ApiPropertyOptional({ description: 'For TELEPORT only', example: 1 })
    @IsOptional()
    @IsInt()
    @Min(0)
    endpointId?: number;
}

export class CreatePlaceableDto {
    @ApiProperty({
        enum: PlaceableKind,
        example: PlaceableKind.HEAL,
    })
    @IsEnum(PlaceableKind)
    kind: PlaceableKind;

    @ApiProperty({ minimum: 0, example: 6 })
    @IsInt()
    @Min(0)
    x: number;

    @ApiProperty({ minimum: 0, example: 3 })
    @IsInt()
    @Min(0)
    y: number;

    @ApiPropertyOptional({ enum: Orientation, example: Orientation.E })
    @IsOptional()
    @IsEnum(Orientation)
    orientation?: Orientation;
}

export class CreateGameDto {
    @ApiProperty({ enum: MapSize, example: MapSize.LARGE })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode, example: GameMode.CLASSIC })
    @IsEnum(GameMode)
    readonly mode: GameMode;

    @ApiProperty({ example: 'New game' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'Description…' })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    readonly visibility?: boolean;

    @ApiProperty({
        type: [CreateTileDto],
        description: 'Sparse tiles: only those different from BASE',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTileDto)
    readonly tiles: CreateTileDto[] = [];

    /** Placed objects */
    @ApiProperty({ type: [CreatePlaceableDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePlaceableDto)
    readonly objects: CreatePlaceableDto[] = [];
}
