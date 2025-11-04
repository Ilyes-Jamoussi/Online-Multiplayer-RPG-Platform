// import { Body, Controller, Post } from '@nestjs/common';
// import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { AdminModeToggledDto } from '../dto/admin-mode-toggled.dto';
// import { AttackPlayerActionDto } from '../dto/attack-player-action.dto';
// import { CombatAbandonDto } from '../dto/combat-abandon.dto';
// import { CombatChoiceDto } from '../dto/combat-choice.dto';
// import { CombatPostureSelectedDto } from '../dto/combat-posture-selected.dto';
// import { CombatStartedDto } from '../dto/combat-started.dto';
// import { CombatVictoryDto } from '../dto/combat-victory.dto';
// import { DoorToggledDto } from '../dto/door-toggled.dto';
// import { GameOverDto } from '../dto/game-over.dto';
// import { PlayerCombatDrawsDto } from '../dto/player-combat-draws.dto';
// import { PlayerCombatLossesDto } from '../dto/player-combat-losses.dto';
// import { PlayerCombatStatsDto } from '../dto/player-combat-stats.dto';
// import { PlayerCombatWinsDto } from '../dto/player-combat-wins.dto';
// import { PlayerHealthChangedDto } from '../dto/player-health-changed.dto';
// import { PlayerLeftSessionDto } from '../dto/player-left-session.dto';
// import { PlayerMoveDto } from '../dto/player-move.dto';
// import { PlayerMovedDto } from '../dto/player-moved.dto';
// import { PlayerTeleportDto } from '../dto/player-teleport.dto';
// import { PlayerTeleportedDto } from '../dto/player-teleported.dto';
// import { ToggleDoorActionDto } from '../dto/toggle-door-action.dto';

// @ApiTags('In-Game DTOs (temporary for generation)')
// @Controller('in-game-dto')
// export class InGameDtoController {
//     @Post('game-over')
//     @ApiOperation({ summary: 'DTO for GameOver' })
//     gameOver(@Body() dto: GameOverDto): void {}

//     @Post('player-teleported')
//     @ApiOperation({ summary: 'DTO for PlayerTeleported' })
//     playerTeleported(@Body() dto: PlayerTeleportedDto): void {}

//     @Post('player-moved')
//     @ApiOperation({ summary: 'DTO for PlayerMoved' })
//     playerMoved(@Body() dto: PlayerMovedDto): void {}

//     @Post('door-toggled')
//     @ApiOperation({ summary: 'DTO for DoorToggled' })
//     doorToggled(@Body() dto: DoorToggledDto): void {}

//     @Post('admin-mode-toggled')
//     @ApiOperation({ summary: 'DTO for AdminModeToggled' })
//     adminModeToggled(@Body() dto: AdminModeToggledDto): void {}

//     @Post('player-left-session')
//     @ApiOperation({ summary: 'DTO for PlayerLeftSession' })
//     playerLeftSession(@Body() dto: PlayerLeftSessionDto): void {}

//     @Post('player-move')
//     @ApiOperation({ summary: 'DTO for PlayerMove' })
//     playerMove(@Body() dto: PlayerMoveDto): void {}

//     @Post('player-teleport')
//     @ApiOperation({ summary: 'DTO for PlayerTeleport' })
//     playerTeleport(@Body() dto: PlayerTeleportDto): void {}

//     @Post('toggle-door-action')
//     @ApiOperation({ summary: 'DTO for ToggleDoorAction' })
//     toggleDoorAction(@Body() dto: ToggleDoorActionDto): void {}

//     @Post('attack-player-action')
//     @ApiOperation({ summary: 'DTO for AttackPlayerAction' })
//     attackPlayerAction(@Body() dto: AttackPlayerActionDto): void {}

//     @Post('combat-choice')
//     @ApiOperation({ summary: 'DTO for CombatChoice' })
//     combatChoice(@Body() dto: CombatChoiceDto): void {}

//     @Post('combat-abandon')
//     @ApiOperation({ summary: 'DTO for CombatAbandon' })
//     combatAbandon(@Body() dto: CombatAbandonDto): void {}

//     @Post('combat-started')
//     @ApiOperation({ summary: 'DTO for CombatStarted' })
//     combatStarted(@Body() dto: CombatStartedDto): void {}

//     @Post('combat-victory')
//     @ApiOperation({ summary: 'DTO for CombatVictory' })
//     combatVictory(@Body() dto: CombatVictoryDto): void {}

//     @Post('combat-posture-selected')
//     @ApiOperation({ summary: 'DTO for CombatPostureSelected' })
//     combatPostureSelected(@Body() dto: CombatPostureSelectedDto): void {}

//     @Post('player-health-changed')
//     @ApiOperation({ summary: 'DTO for PlayerHealthChanged' })
//     playerHealthChanged(@Body() dto: PlayerHealthChangedDto): void {}

//     @Post('player-combat-stats')
//     @ApiOperation({ summary: 'DTO for PlayerCombatStats' })
//     playerCombatStats(@Body() dto: PlayerCombatStatsDto): void {}

//     @Post('player-combat-wins')
//     @ApiOperation({ summary: 'DTO for PlayerCombatWins' })
//     playerCombatWins(@Body() dto: PlayerCombatWinsDto): void {}

//     @Post('player-combat-losses')
//     @ApiOperation({ summary: 'DTO for PlayerCombatLosses' })
//     playerCombatLosses(@Body() dto: PlayerCombatLossesDto): void {}

//     @Post('player-combat-draws')
//     @ApiOperation({ summary: 'DTO for PlayerCombatDraws' })
//     playerCombatDraws(@Body() dto: PlayerCombatDrawsDto): void {}
// }
