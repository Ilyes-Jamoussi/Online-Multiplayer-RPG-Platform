import { Injectable } from '@angular/core';
import { AVATAR_ANIMATED_PATH, AVATAR_STATIC_PATH, DICE_PATH } from '@app/constants/assets-paths.constants';
import { Avatar } from '@common/enums/avatar.enum';

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
}
