import { Avatar } from '../enums/avatar.enum';
import { AvatarAssignment } from '../models/session.model';

export const DEFAULT_AVATAR_ASSIGNMENTS: AvatarAssignment[] = Object.values(Avatar).map(
    (avatar): AvatarAssignment => ({
        avatar,
        chosenBy: null,
    }),
);
