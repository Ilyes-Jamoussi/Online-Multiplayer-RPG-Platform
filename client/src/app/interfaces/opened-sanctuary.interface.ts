import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export interface OpenedSanctuary {
    kind: PlaceableKind;
    x: number;
    y: number;
    success: boolean;
    addedHealth?: number;
    addedDefense?: number;
    addedAttack?: number;
}
