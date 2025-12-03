import { ApiProperty } from '@nestjs/swagger';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

export class SessionPreviewDto {
    @ApiProperty()
    readonly id: string;

    @ApiProperty()
    readonly currentPlayers: number;

    @ApiProperty()
    readonly maxPlayers: number;

    @ApiProperty()
    readonly gameName: string;

    @ApiProperty()
    readonly gameDescription: string;

    @ApiProperty({ enum: MapSize, enumName: 'MapSize' })
    readonly mapSize: MapSize;

    @ApiProperty({ enum: GameMode, enumName: 'GameMode' })
    readonly gameMode: GameMode;
}

export class AvailableSessionsUpdatedDto {
    @ApiProperty({ type: [SessionPreviewDto] })
    readonly sessions: SessionPreviewDto[];
}
