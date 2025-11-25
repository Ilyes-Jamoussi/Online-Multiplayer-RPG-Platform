import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export interface SanctuaryUseEntryDto {
    sessionId: string;
    playerId: string;
    kind: PlaceableKind;
    x: number;
    y: number;
    addedHealth?: number;
    addedDefense?: number;
    addedAttack?: number;
}
