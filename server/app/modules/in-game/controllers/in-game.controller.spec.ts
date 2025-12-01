import { Test, TestingModule } from '@nestjs/testing';
import { InGameController } from './in-game.controller';
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
import { PlaceableDisabledUpdatedDto } from '@app/modules/in-game/dto/placeable-disabled-updated.dto';

describe('InGameController', () => {
    let controller: InGameController;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [InGameController],
        }).compile();

        controller = module.get<InGameController>(InGameController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should handle playerMove', () => {
        const data = {} as PlayerMoveDto;
        expect(() => controller.playerMove(data)).not.toThrow();
    });

    it('should handle playerMoved', () => {
        const data = {} as PlayerMovedDto;
        expect(() => controller.playerMoved(data)).not.toThrow();
    });

    it('should handle combatChoice', () => {
        const data = {} as CombatChoiceDto;
        expect(() => controller.combatChoice(data)).not.toThrow();
    });

    it('should handle combatPostureSelected', () => {
        const data = {} as CombatPostureSelectedDto;
        expect(() => controller.combatPostureSelected(data)).not.toThrow();
    });

    it('should handle playerCombatWins', () => {
        const data = {} as PlayerCombatWinsDto;
        expect(() => controller.playerCombatWins(data)).not.toThrow();
    });

    it('should handle combatStarted', () => {
        const data = {} as CombatStartedDto;
        expect(() => controller.combatStarted(data)).not.toThrow();
    });

    it('should handle playerCombatLosses', () => {
        const data = {} as PlayerCombatLossesDto;
        expect(() => controller.playerCombatLosses(data)).not.toThrow();
    });

    it('should handle playerLeftSession', () => {
        const data = {} as PlayerLeftSessionDto;
        expect(() => controller.playerLeftSession(data)).not.toThrow();
    });

    it('should handle toggleDoorAction', () => {
        const data = {} as ToggleDoorActionDto;
        expect(() => controller.toggleDoorAction(data)).not.toThrow();
    });

    it('should handle combatAbandon', () => {
        const data = {} as CombatAbandonDto;
        expect(() => controller.combatAbandon(data)).not.toThrow();
    });

    it('should handle playerCombatDraws', () => {
        const data = {} as PlayerCombatDrawsDto;
        expect(() => controller.playerCombatDraws(data)).not.toThrow();
    });

    it('should handle combatVictory', () => {
        const data = {} as CombatVictoryDto;
        expect(() => controller.combatVictory(data)).not.toThrow();
    });

    it('should handle playerCombatStats', () => {
        const data = {} as PlayerCombatStatsDto;
        expect(() => controller.playerCombatStats(data)).not.toThrow();
    });

    it('should handle gameOver', () => {
        const data = {} as GameOverDto;
        expect(() => controller.gameOver(data)).not.toThrow();
    });

    it('should handle playerTeleported', () => {
        const data = {} as PlayerTeleportedDto;
        expect(() => controller.playerTeleported(data)).not.toThrow();
    });

    it('should handle doorToggled', () => {
        const data = {} as DoorToggledDto;
        expect(() => controller.doorToggled(data)).not.toThrow();
    });

    it('should handle playerTeleport', () => {
        const data = {} as PlayerTeleportDto;
        expect(() => controller.playerTeleport(data)).not.toThrow();
    });

    it('should handle adminModeToggled', () => {
        const data = {} as AdminModeToggledDto;
        expect(() => controller.adminModeToggled(data)).not.toThrow();
    });

    it('should handle playerHealthChanged', () => {
        const data = {} as PlayerHealthChangedDto;
        expect(() => controller.playerHealthChanged(data)).not.toThrow();
    });

    it('should handle attackPlayerAction', () => {
        const data = {} as AttackPlayerActionDto;
        expect(() => controller.attackPlayerAction(data)).not.toThrow();
    });

    it('should handle gameStatistics', () => {
        const data = {} as GameStatisticsDto;
        expect(() => controller.gameStatistics(data)).not.toThrow();
    });

    it('should handle emptyResponse', () => {
        const data = {} as EmptyResponseDto;
        expect(() => controller.emptyResponse(data)).not.toThrow();
    });

    it('should handle placeablePositionUpdated', () => {
        const data = {} as PlaceablePositionUpdatedDto;
        expect(() => controller.placeablePositionUpdated(data)).not.toThrow();
    });

    it('should handle openSanctuary', () => {
        const data = {} as OpenSanctuaryDto;
        expect(() => controller.openSanctuary(data)).not.toThrow();
    });

    it('should handle sanctuaryActionFailed', () => {
        const data = {} as SanctuaryActionFailedDto;
        expect(() => controller.sanctuaryActionFailed(data)).not.toThrow();
    });

    it('should handle sanctuaryActionSuccess', () => {
        const data = {} as SanctuaryActionSuccessDto;
        expect(() => controller.sanctuaryActionSuccess(data)).not.toThrow();
    });

    it('should handle playerBonusesChanged', () => {
        const data = {} as PlayerBonusesChangedDto;
        expect(() => controller.playerBonusesChanged(data)).not.toThrow();
    });

    it('should handle availableActions', () => {
        const data = {} as AvailableActionsDto;
        expect(() => controller.availableActions(data)).not.toThrow();
    });

    it('should handle playerBoardedBoat', () => {
        const data = {} as PlayerBoardedBoatDto;
        expect(() => controller.playerBoardedBoat(data)).not.toThrow();
    });

    it('should handle playerDisembarkedBoat', () => {
        const data = {} as PlayerDisembarkedBoatDto;
        expect(() => controller.playerDisembarkedBoat(data)).not.toThrow();
    });

    it('should handle flagPickedUp', () => {
        const data = {} as FlagPickedUpDto;
        expect(() => controller.flagPickedUp(data)).not.toThrow();
    });

    it('should handle flagTransferred', () => {
        const data = {} as FlagTransferredDto;
        expect(() => controller.flagTransferred(data)).not.toThrow();
    });

    it('should handle flagTransferRequest', () => {
        const data = {} as FlagTransferRequestDto;
        expect(() => controller.flagTransferRequest(data)).not.toThrow();
    });

    it('should handle flagTransferResponse', () => {
        const data = {} as FlagTransferResponseDto;
        expect(() => controller.flagTransferResponse(data)).not.toThrow();
    });

    it('should handle flagTransferResult', () => {
        const data = {} as FlagTransferResultDto;
        expect(() => controller.flagTransferResult(data)).not.toThrow();
    });

    it('should handle placeableDisabledUpdated', () => {
        const data = {} as PlaceableDisabledUpdatedDto;
        expect(() => controller.placeableDisabledUpdated(data)).not.toThrow();
    });
});

