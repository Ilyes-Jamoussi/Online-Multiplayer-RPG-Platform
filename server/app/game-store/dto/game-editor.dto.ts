import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsArray } from 'class-validator';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameEditorTileDto } from './game-editor-tile.dto';
import { GameEditorPlaceableDto } from './game-editor-placeable.dto';

export class GameEditorDto {
    @ApiProperty()
    @IsString()
    id!: string;

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty({ enum: MapSize, enumName: 'MapSize' })
    @IsEnum(MapSize)
    size!: MapSize;

    @ApiProperty({ enum: GameMode, enumName: 'GameMode' })
    @IsEnum(GameMode)
    mode!: GameMode;

    @ApiProperty({ type: [GameEditorTileDto] })
    @IsArray()
    tiles!: GameEditorTileDto[];

    @ApiProperty({ type: [GameEditorPlaceableDto] })
    @IsArray()
    objects!: GameEditorPlaceableDto[];

    @ApiProperty()
    @IsString()
    gridPreviewUrl!: string;

    @ApiProperty()
    lastModified!: Date;
}
