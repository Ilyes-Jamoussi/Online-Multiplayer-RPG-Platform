import { CombatResultEntryDto } from '@app/modules/game-log/dto/combat-result-entry.dto';
import { GameLogEntryBase, GameLogEntryWithMetadata } from '@app/modules/game-log/dto/game-log-entry-base.dto';
import { SanctuaryUseEntryDto } from '@app/modules/game-log/dto/sanctuary-use-entry.dto';
import { TeleportEntryDto } from '@app/modules/game-log/dto/teleport-entry.dto';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameLogService {
    constructor(private readonly inGameSessionRepository: InGameSessionRepository) {}

    createTurnStartEntry(sessionId: string, playerId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEntryType.TurnStart,
            message: `Début de tour : ${player.name}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'HourglassStart',
        };
    }

    createCombatStartEntry(sessionId: string, attackerId: string, targetId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const attacker = session.inGamePlayers[attackerId];
        const target = session.inGamePlayers[targetId];

        return {
            type: GameLogEntryType.CombatStart,
            message: `Combat : ${attacker.name} contre ${target.name}`,
            involvedPlayerIds: [attackerId, targetId],
            involvedPlayerNames: [attacker.name, target.name],
            icon: 'ShieldHalved',
        };
    }

    createCombatEndEntry(sessionId: string, playerAId: string, playerBId: string, winnerId: string | null): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const playerA = session.inGamePlayers[playerAId];
        const playerB = session.inGamePlayers[playerBId];

        let message: string;
        if (winnerId === null) {
            message = `Combat : ${playerA.name} et ${playerB.name} ont fait match nul`;
        } else {
            const winner = session.inGamePlayers[winnerId];
            const loser = winnerId === playerAId ? playerB : playerA;
            message = `Combat : ${winner.name} vainqueur contre ${loser.name}`;
        }

        return {
            type: GameLogEntryType.CombatEnd,
            message,
            involvedPlayerIds: [playerAId, playerBId],
            involvedPlayerNames: [playerA.name, playerB.name],
            icon: 'ShieldHalved',
        };
    }

    createCombatResultEntry(params: CombatResultEntryDto): GameLogEntryWithMetadata {
        const session = this.inGameSessionRepository.findById(params.sessionId);
        const attacker = session.inGamePlayers[params.attackerId];
        const target = session.inGamePlayers[params.targetId];

        const attackTotal = params.attackerAttack.totalAttack;
        const defenseTotal = params.targetDefense.totalDefense;
        const damageValue = params.damage;

        const attackPart = `A:${params.attackerAttack.diceRoll}+${params.attackerAttack.baseAttack}+${params.attackerAttack.attackBonus}`;
        const defensePart = `D:${params.targetDefense.diceRoll}+${params.targetDefense.baseDefense}+${params.targetDefense.defenseBonus}`;
        const damagePart = `${damageValue > 0 ? '+' : ''}${damageValue}`;
        const message = `Attaque ${attacker.name} vs ${target.name} (${attackPart} - ${defensePart} = ${damagePart})`;

        return {
            type: GameLogEntryType.CombatResult,
            message,
            involvedPlayerIds: [params.attackerId, params.targetId],
            involvedPlayerNames: [attacker.name, target.name],
            icon: 'Bolt',
            metadata: {
                attackerId: params.attackerId,
                targetId: params.targetId,
                attackTotal,
                defenseTotal,
                damage: damageValue,
            },
        };
    }

    createDoorToggleEntry(sessionId: string, playerId: string, x: number, y: number, isOpen: boolean): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        const action = isOpen ? 'ouverte' : 'fermée';
        return {
            type: GameLogEntryType.DoorToggle,
            message: `Porte ${action} à (${x}, ${y}) par ${player.name}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Lock',
        };
    }

    createDebugModeToggleEntry(sessionId: string, playerId: string, isActive: boolean): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        const action = isActive ? 'activé' : 'désactivé';
        return {
            type: GameLogEntryType.DebugModeToggle,
            message: `Mode débogage: ${action}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Gear',
        };
    }

    createPlayerAbandonEntry(sessionId: string, playerId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEntryType.GameAbandon,
            message: `${player.name} a abandonné la partie`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'UserMinus',
        };
    }

    createGameOverEntry(sessionId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const activePlayers = Object.values(session.inGamePlayers).filter((p) => p.isInGame);
        const activePlayerNames = activePlayers.map((p) => p.name);
        const activePlayerIds = activePlayers.map((p) => p.id);

        const playersList = activePlayerNames.join(', ');
        return {
            type: GameLogEntryType.GameOver,
            message: `Fin de partie. Joueurs actifs: ${playersList}`,
            involvedPlayerIds: activePlayerIds,
            involvedPlayerNames: activePlayerNames,
            icon: 'Check',
        };
    }

    createBoatEmbarkEntry(sessionId: string, playerId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEntryType.BoatEmbark,
            message: `${player.name} a embarqué sur un bateau`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Anchor',
        };
    }

    createBoatDisembarkEntry(sessionId: string, playerId: string): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEntryType.BoatDisembark,
            message: `${player.name} a débarqué d'un bateau`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Anchor',
        };
    }

    createSanctuaryUseEntry(params: SanctuaryUseEntryDto): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(params.sessionId);
        const player = session.inGamePlayers[params.playerId];

        let message: string;
        const kindStr = String(params.kind);
        if (kindStr === 'HEAL' && params.addedHealth) {
            message = `${player.name} a utilisé un sanctuaire de soin à (${params.x}, ${params.y}) (+${params.addedHealth} santé)`;
        } else if (kindStr === 'FIGHT' && (params.addedDefense || params.addedAttack)) {
            const bonus = params.addedDefense || params.addedAttack || 0;
            message = `${player.name} a utilisé un sanctuaire de combat à (${params.x}, ${params.y}) (+${bonus} attaque/défense)`;
        } else {
            message = `${player.name} a utilisé un sanctuaire à (${params.x}, ${params.y})`;
        }

        return {
            type: GameLogEntryType.SanctuaryUse,
            message,
            involvedPlayerIds: [params.playerId],
            involvedPlayerNames: [player.name],
            icon: 'Heart',
        };
    }

    createTeleportEntry(params: TeleportEntryDto): GameLogEntryBase {
        const session = this.inGameSessionRepository.findById(params.sessionId);
        const player = session.inGamePlayers[params.playerId];

        return {
            type: GameLogEntryType.Teleport,
            message: `${player.name} s'est téléporté de (${params.originX}, ${params.originY}) → (${params.destinationX}, ${params.destinationY})`,
            involvedPlayerIds: [params.playerId],
            involvedPlayerNames: [player.name],
            icon: 'LocationDot',
        };
    }
}
