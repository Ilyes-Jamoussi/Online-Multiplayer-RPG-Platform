import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GameEditorPlaceableDto } from './game-editor-placeable.dto';
import { GameEditorTileDto } from './game-editor-tile.dto';

export class PatchGameEditorDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: MapSize })
    @IsOptional()
    @IsEnum(MapSize)
    size?: MapSize;

    @ApiPropertyOptional({ enum: GameMode })
    @IsOptional()
    @IsEnum(GameMode)
    mode?: GameMode;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    gridPreviewUrl?: string;

    @ApiPropertyOptional({ type: [GameEditorTileDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GameEditorTileDto)
    tiles?: GameEditorTileDto[];

    @ApiPropertyOptional({ type: [GameEditorPlaceableDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GameEditorPlaceableDto)
    objects?: GameEditorPlaceableDto[];
}
