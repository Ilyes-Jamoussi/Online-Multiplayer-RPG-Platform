/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function -- OpenAPI DTO generation placeholders */
import { AdminModeToggledDto } from '@app/modules/in-game/dto/admin-mode-toggled.dto';
import { AttackPlayerActionDto } from '@app/modules/in-game/dto/attack-player-action.dto';
import { AvailableActionsDto } from '@app/modules/in-game/dto/available-actions.dto';
import { CombatAbandonDto } from '@app/modules/in-game/dto/combat-abandon.dto';
import { CombatChoiceDto } from '@app/modules/in-game/dto/combat-choice.dto';
import { CombatPostureSelectedDto } from '@app/modules/in-game/dto/combat-posture-selected.dto';
import { CombatStartedDto } from '@app/modules/in-game/dto/combat-started.dto';
import { CombatVictoryDto } from '@app/modules/in-game/dto/combat-victory.dto';
import { DoorToggledDto } from '@app/modules/in-game/dto/door-toggled.dto';
import { EmptyResponseDto } from '@app/modules/in-game/dto/empty-response.dto';
import { FlagPickedUpDto } from '@app/modules/in-game/dto/flag-picked-up.dto';
import { FlagTransferRequestDto } from '@app/modules/in-game/dto/flag-transfer-request.dto';
import { FlagTransferResponseDto } from '@app/modules/in-game/dto/flag-transfer-response.dto';
import { FlagTransferResultDto } from '@app/modules/in-game/dto/flag-transfer-result.dto';
import { FlagTransferredDto } from '@app/modules/in-game/dto/flag-transferred.dto';
import { GameOverDto } from '@app/modules/in-game/dto/game-over.dto';
import { GameStatisticsDto } from '@app/modules/in-game/dto/game-statistics.dto';
import { OpenSanctuaryDto } from '@app/modules/in-game/dto/open-sanctuary.dto';
import { PlaceablePositionUpdatedDto } from '@app/modules/in-game/dto/placeable-position-updated.dto';
import { PlayerBoardedBoatDto } from '@app/modules/in-game/dto/player-boarded-boat.dto';
import { PlayerBonusesChangedDto } from '@app/modules/in-game/dto/player-bonuses-changed.dto';
import { PlayerCombatDrawsDto } from '@app/modules/in-game/dto/player-combat-draws.dto';
import { PlayerCombatLossesDto } from '@app/modules/in-game/dto/player-combat-losses.dto';
import { PlayerCombatStatsDto } from '@app/modules/in-game/dto/player-combat-stats.dto';
import { PlayerCombatWinsDto } from '@app/modules/in-game/dto/player-combat-wins.dto';
import { PlayerDisembarkedBoatDto } from '@app/modules/in-game/dto/player-disembarked-boat.dto';
import { PlayerHealthChangedDto } from '@app/modules/in-game/dto/player-health-changed.dto';
import { PlayerLeftSessionDto } from '@app/modules/in-game/dto/player-left-session.dto';
import { PlayerMoveDto } from '@app/modules/in-game/dto/player-move.dto';
import { PlayerMovedDto } from '@app/modules/in-game/dto/player-moved.dto';
import { PlayerTeleportDto } from '@app/modules/in-game/dto/player-teleport.dto';
import { PlayerTeleportedDto } from '@app/modules/in-game/dto/player-teleported.dto';
import { SanctuaryActionFailedDto } from '@app/modules/in-game/dto/sanctuary-action-failed.dto';
import { SanctuaryActionSuccessDto } from '@app/modules/in-game/dto/sanctuary-action-success.dto';
import { ToggleDoorActionDto } from '@app/modules/in-game/dto/toggle-door-action.dto';
import { Body, Controller, Post } from '@nestjs/common';
import { PlaceableDisabledUpdatedDto } from '@app/modules/in-game/dto/placeable-disabled-updated.dto';

@Controller('in-game')
export class InGameController {
    @Post('player-move')
    playerMove(@Body() data: PlayerMoveDto): void {}

    @Post('player-moved')
    playerMoved(@Body() data: PlayerMovedDto): void {}

    @Post('combat-choice')
    combatChoice(@Body() data: CombatChoiceDto): void {}

    @Post('combat-posture-selected')
    combatPostureSelected(@Body() data: CombatPostureSelectedDto): void {}

    @Post('player-combat-wins')
    playerCombatWins(@Body() data: PlayerCombatWinsDto): void {}

    @Post('combat-started')
    combatStarted(@Body() data: CombatStartedDto): void {}

    @Post('player-combat-losses')
    playerCombatLosses(@Body() data: PlayerCombatLossesDto): void {}

    @Post('player-left-session')
    playerLeftSession(@Body() data: PlayerLeftSessionDto): void {}

    @Post('toggle-door-action')
    toggleDoorAction(@Body() data: ToggleDoorActionDto): void {}

    @Post('combat-abandon')
    combatAbandon(@Body() data: CombatAbandonDto): void {}

    @Post('player-combat-draws')
    playerCombatDraws(@Body() data: PlayerCombatDrawsDto): void {}

    @Post('combat-victory')
    combatVictory(@Body() data: CombatVictoryDto): void {}

    @Post('player-combat-stats')
    playerCombatStats(@Body() data: PlayerCombatStatsDto): void {}

    @Post('game-over')
    gameOver(@Body() data: GameOverDto): void {}

    @Post('player-teleported')
    playerTeleported(@Body() data: PlayerTeleportedDto): void {}

    @Post('door-toggled')
    doorToggled(@Body() data: DoorToggledDto): void {}

    @Post('player-teleport')
    playerTeleport(@Body() data: PlayerTeleportDto): void {}

    @Post('admin-mode-toggled')
    adminModeToggled(@Body() data: AdminModeToggledDto): void {}

    @Post('player-health-changed')
    playerHealthChanged(@Body() data: PlayerHealthChangedDto): void {}

    @Post('attack-player-action')
    attackPlayerAction(@Body() data: AttackPlayerActionDto): void {}

    @Post('game-statistics')
    gameStatistics(@Body() data: GameStatisticsDto): void {}

    @Post('empty-response')
    emptyResponse(@Body() data: EmptyResponseDto): void {}

    @Post('placeable-position-updated')
    placeablePositionUpdated(@Body() data: PlaceablePositionUpdatedDto): void {}

    @Post('open-sanctuary')
    openSanctuary(@Body() data: OpenSanctuaryDto): void {}

    @Post('sanctuary-action-failed')
    sanctuaryActionFailed(@Body() data: SanctuaryActionFailedDto): void {}

    @Post('sanctuary-action-success')
    sanctuaryActionSuccess(@Body() data: SanctuaryActionSuccessDto): void {}

    @Post('player-bonuses-changed')
    playerBonusesChanged(@Body() data: PlayerBonusesChangedDto): void {}

    @Post('available-actions')
    availableActions(@Body() data: AvailableActionsDto): void {}

    @Post('player-boarded-boat')
    playerBoardedBoat(@Body() data: PlayerBoardedBoatDto): void {}

    @Post('player-disembarked-boat')
    playerDisembarkedBoat(@Body() data: PlayerDisembarkedBoatDto): void {}

    @Post('flag-picked-up')
    flagPickedUp(@Body() data: FlagPickedUpDto): void {}

    @Post('flag-transferred')
    flagTransferred(@Body() data: FlagTransferredDto): void {}

    @Post('flag-transfer-request')
    flagTransferRequest(@Body() data: FlagTransferRequestDto): void {}

    @Post('flag-transfer-response')
    flagTransferResponse(@Body() data: FlagTransferResponseDto): void {}

    @Post('flag-transfer-result')
    flagTransferResult(@Body() data: FlagTransferResultDto): void {}

    @Post('placeable-disabled-updated')
    placeableDisabledUpdated(@Body() data: PlaceableDisabledUpdatedDto): void {}
}
