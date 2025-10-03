import { MapSize } from '@common/enums/map-size.enum';
import { ItemContainer } from '@common/interfaces/item-container.interface';
import { Tile } from '@common/interfaces/tile.interface';
import { Player } from '@common/models/player.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsObject, IsString } from 'class-validator';

export class CreateSessionDto {
    @ApiProperty()
    @IsEnum(MapSize)
    readonly mapSize: MapSize;

    @ApiProperty()
    @IsObject()
    readonly player: Player;

    @ApiProperty()
    @IsArray()
    readonly map: Tile[][];

    @ApiProperty()
    @IsArray()
    readonly itemContainers: ItemContainer[];
}

export class SessionCreatedDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    readonly playerId: string;
}
