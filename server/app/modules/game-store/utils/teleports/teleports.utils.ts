import { MAX_TELEPORT_CHANNEL } from '@app/constants/game-config.constants';
import { TeleportChannel } from '../../entities/teleport-channel.entity';

const makeDefaultTeleportChannels = (): TeleportChannel[] => {
    const out: TeleportChannel[] = [];
    for (let i = 0; i < MAX_TELEPORT_CHANNEL; i++) {
        out.push({ channelNumber: i + 1, tiles: undefined });
    }
    return out;
};

export { makeDefaultTeleportChannels };

