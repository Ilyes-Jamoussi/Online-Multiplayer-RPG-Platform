// server/src/games/dto/create-game.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export enum ApiTileKind {
    WALL = 'WALL',
    WATER = 'WATER',
    ICE = 'ICE',
    DOOR = 'DOOR',
    TELEPORT = 'TELEPORT',
}

export enum ApiPlaceableKind {
    START = 'START',
    FLAG = 'FLAG',
    HEAL = 'HEAL',
    FIGHT = 'FIGHT',
    BOAT = 'BOAT',
}

export enum ApiOrientation {
    N = 'N',
    E = 'E',
    S = 'S',
    W = 'W',
}

export class TileCreateDto {
    @ApiProperty({ minimum: 0, example: 7 })
    @IsInt()
    @Min(0)
    x: number;

    @ApiProperty({ minimum: 0, example: 12 })
    @IsInt()
    @Min(0)
    y: number;

    @ApiProperty({ enum: ApiTileKind, example: ApiTileKind.WALL })
    @IsEnum(ApiTileKind)
    kind: ApiTileKind;

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

export class PlaceableCreateDto {
    @ApiProperty({
        enum: ApiPlaceableKind,
        example: ApiPlaceableKind.HEAL,
    })
    @IsEnum(ApiPlaceableKind)
    kind: ApiPlaceableKind;

    @ApiProperty({ minimum: 0, example: 6 })
    @IsInt()
    @Min(0)
    x: number;

    @ApiProperty({ minimum: 0, example: 3 })
    @IsInt()
    @Min(0)
    y: number;

    @ApiPropertyOptional({ enum: ApiOrientation, example: ApiOrientation.E })
    @IsOptional()
    @IsEnum(ApiOrientation)
    orientation?: ApiOrientation;

    @ApiPropertyOptional({
        description: 'Optional ID for reference; if not provided, the server will generate one',
        example: 'a8tq7w8',
    })
    @IsOptional()
    @IsString()
    id?: string;
}

export class CreateGameDto {
    @ApiProperty({ enum: MapSize, example: MapSize.Large })
    @IsEnum(MapSize)
    readonly size: MapSize;

    @ApiProperty({ enum: GameMode, example: GameMode.Classic })
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
        type: [TileCreateDto],
        description: 'Sparse tiles: only those different from BASE',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TileCreateDto)
    readonly tiles: TileCreateDto[] = [];

    /** Placed objects */
    @ApiProperty({ type: [PlaceableCreateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlaceableCreateDto)
    readonly objects: PlaceableCreateDto[] = [];
}
