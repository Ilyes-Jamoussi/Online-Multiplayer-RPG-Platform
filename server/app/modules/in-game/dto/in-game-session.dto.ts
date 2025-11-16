import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/interfaces/player.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { TurnState } from '@common/interfaces/turn-state.interface';
import { ApiProperty } from '@nestjs/swagger';

export class InGameSessionDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    gameId: string;

    @ApiProperty()
    maxPlayers: number;

    @ApiProperty()
    inGameId: string;

    @ApiProperty()
    isGameStarted: boolean;

    @ApiProperty({ type: Object })
    inGamePlayers: Record<string, Player>;

    @ApiProperty()
    currentTurn: TurnState;

    @ApiProperty({ type: [Object] })
    startPoints: StartPoint[];

    @ApiProperty({ enum: MapSize })
    mapSize: MapSize;

    @ApiProperty({ enum: GameMode })
    mode: GameMode;

    @ApiProperty({ type: [String] })
    turnOrder: string[];

    @ApiProperty({ required: false })
    isAdminModeActive?: boolean;

    @ApiProperty({ required: false })
    gameStartTime?: Date;
}
