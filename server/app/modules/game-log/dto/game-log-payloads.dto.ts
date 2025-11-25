import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { AttackerAttackDto, TargetDefenseDto } from './combat-result-entry.dto';

export interface TurnStartedPayload {
    session: InGameSession;
}

export interface CombatStartedPayload {
    sessionId: string;
    attackerId: string;
    targetId: string;
}

export interface CombatVictoryPayload {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    winnerId: string | null;
}

export interface PlayerCombatResultPayload {
    sessionId: string;
    playerAId: string;
    playerBId: string;
    playerAAttack: AttackerAttackDto;
    playerBAttack: AttackerAttackDto;
    playerADefense: TargetDefenseDto;
    playerBDefense: TargetDefenseDto;
    playerADamage: number;
    playerBDamage: number;
}

export interface DoorToggledPayload {
    session: InGameSession;
    playerId: string;
    x: number;
    y: number;
    isOpen: boolean;
}

export interface AdminModeToggledPayload {
    sessionId: string;
    playerId: string;
    isAdminModeActive: boolean;
}

export interface PlayerAbandonPayload {
    sessionId: string;
    playerId: string;
    playerName: string;
}

export interface GameOverPayload {
    sessionId: string;
    winnerId: string;
    winnerName: string;
}

export interface PlayerBoardedBoatPayload {
    session: InGameSession;
    playerId: string;
    boatId: string;
}

export interface PlayerDisembarkedBoatPayload {
    session: InGameSession;
    playerId: string;
}

export interface SanctuaryActionSuccessPayload {
    session: InGameSession;
    playerId: string;
    kind: PlaceableKind;
    x: number;
    y: number;
    addedHealth?: number;
    addedDefense?: number;
    addedAttack?: number;
}

export interface TeleportedPayload {
    session: InGameSession;
    playerId: string;
    originX: number;
    originY: number;
    destinationX: number;
    destinationY: number;
}
