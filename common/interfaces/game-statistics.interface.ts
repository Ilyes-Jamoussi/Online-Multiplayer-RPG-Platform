import { GameStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';

export interface StoredStatistics {
    data: GameStatisticsDto;
    timestamp: number;
}
