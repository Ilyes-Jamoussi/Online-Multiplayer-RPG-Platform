import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { GameEditorPlaceableDto } from './game-editor-placeable.dto';
import { GameEditorTileDto } from './game-editor-tile.dto';
import { TeleportChannelDto } from './teleport-channel.dto';
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

    @ApiProperty({ type: [TeleportChannelDto] })
    @IsArray()
    teleportChannels!: TeleportChannelDto[];

    @ApiProperty()
    @IsString()
    gridPreviewUrl!: string;

    @ApiProperty()
    lastModified!: Date;
}
