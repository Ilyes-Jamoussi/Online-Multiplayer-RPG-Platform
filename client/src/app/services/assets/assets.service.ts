import { Injectable } from '@angular/core';
import { AVATAR_ANIMATED_PATH, AVATAR_STATIC_PATH, DICE_PATH, OBJECT_PATH, TILE_PATH } from '@app/constants/assets-paths.constants';
import { Avatar } from '@common/enums/avatar.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

@Injectable({ providedIn: 'root' })
export class AssetsService {
    getAvatarStaticImage(avatar: Avatar | null): string {
        if (!avatar) return '';
        return `${AVATAR_STATIC_PATH}/${avatar.toLowerCase()}.png`;
    }

    getAvatarAnimatedImage(avatar: Avatar | null): string {
        if (!avatar) return '';
        return `${AVATAR_ANIMATED_PATH}/${avatar.toLowerCase()}.gif`;
    }

    getAvatarStaticByNumber(avatarNumber: number): string {
        return `${AVATAR_STATIC_PATH}/avatarS${avatarNumber}.png`;
    }

    getAvatarAnimatedByNumber(avatarNumber: number): string {
        return `${AVATAR_ANIMATED_PATH}/avatar${avatarNumber}.gif`;
    }

    getDiceImage(diceType: string): string {
        return `${DICE_PATH}/${diceType.toLowerCase()}.svg`;
    }

    getTileImage(kind: TileKind, opened: boolean = false): string {
        if (kind === TileKind.DOOR) {
            const state = opened ? 'opened' : 'closed';
            return `${TILE_PATH}/${state}-door.png`;
        }
        return `${TILE_PATH}/${kind.toLowerCase()}.png`;
    }

    getPlaceableImage(kind: PlaceableKind): string {
        return `${OBJECT_PATH}/${kind.toLowerCase()}.png`;
    }
}
