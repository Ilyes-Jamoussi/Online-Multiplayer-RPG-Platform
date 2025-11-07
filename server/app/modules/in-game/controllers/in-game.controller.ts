import { Controller, Post, Body } from '@nestjs/common';
import { PlayerMoveDto } from '../dto/player-move.dto';
import { PlayerMovedDto } from '../dto/player-moved.dto';
import { CombatChoiceDto } from '../dto/combat-choice.dto';
import { CombatPostureSelectedDto } from '../dto/combat-posture-selected.dto';
import { PlayerCombatWinsDto } from '../dto/player-combat-wins.dto';
import { CombatStartedDto } from '../dto/combat-started.dto';
import { PlayerCombatLossesDto } from '../dto/player-combat-losses.dto';
import { PlayerLeftSessionDto } from '../dto/player-left-session.dto';
import { ToggleDoorActionDto } from '../dto/toggle-door-action.dto';
import { CombatAbandonDto } from '../dto/combat-abandon.dto';
import { PlayerCombatDrawsDto } from '../dto/player-combat-draws.dto';
import { CombatVictoryDto } from '../dto/combat-victory.dto';
import { PlayerCombatStatsDto } from '../dto/player-combat-stats.dto';
import { GameOverDto } from '../dto/game-over.dto';
import { PlayerTeleportedDto } from '../dto/player-teleported.dto';
import { DoorToggledDto } from '../dto/door-toggled.dto';
import { PlayerTeleportDto } from '../dto/player-teleport.dto';
import { AdminModeToggledDto } from '../dto/admin-mode-toggled.dto';
import { PlayerHealthChangedDto } from '../dto/player-health-changed.dto';
import { AttackPlayerActionDto } from '../dto/attack-player-action.dto';

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
}
