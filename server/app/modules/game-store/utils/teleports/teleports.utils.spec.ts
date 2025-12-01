import { MAX_TELEPORT_CHANNEL } from '@app/constants/game-config.constants';
import { TeleportChannel } from '@app/modules/game-store/entities/teleport-channel.entity';
import { makeDefaultTeleportChannels } from './teleports.utils';

describe('teleports.utils', () => {
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const THREE = 3;
    const FOUR = 4;
    const EXPECTED_CHANNEL_COUNT = MAX_TELEPORT_CHANNEL;
    const FIRST_CHANNEL_NUMBER = 1;
    const SECOND_CHANNEL_NUMBER = 2;
    const THIRD_CHANNEL_NUMBER = 3;
    const FOURTH_CHANNEL_NUMBER = 4;
    const FIFTH_CHANNEL_NUMBER = 5;

    describe('makeDefaultTeleportChannels', () => {
        it('should return array with correct length', () => {
            const result = makeDefaultTeleportChannels();

            expect(result.length).toBe(EXPECTED_CHANNEL_COUNT);
        });

        it('should return array of TeleportChannel objects', () => {
            const result = makeDefaultTeleportChannels();

            expect(Array.isArray(result)).toBe(true);
            result.forEach((channel) => {
                expect(channel).toHaveProperty('channelNumber');
                expect(channel).toHaveProperty('tiles');
            });
        });

        it('should set tiles to undefined for all channels', () => {
            const result = makeDefaultTeleportChannels();

            result.forEach((channel) => {
                expect(channel.tiles).toBeUndefined();
            });
        });

        it('should set channelNumber starting from 1', () => {
            const result = makeDefaultTeleportChannels();

            expect(result[ZERO].channelNumber).toBe(FIRST_CHANNEL_NUMBER);
        });

        it('should set channelNumber sequentially from 1 to MAX_TELEPORT_CHANNEL', () => {
            const result = makeDefaultTeleportChannels();

            expect(result[ZERO].channelNumber).toBe(FIRST_CHANNEL_NUMBER);
            expect(result[ONE].channelNumber).toBe(SECOND_CHANNEL_NUMBER);
            expect(result[TWO].channelNumber).toBe(THIRD_CHANNEL_NUMBER);
            expect(result[THREE].channelNumber).toBe(FOURTH_CHANNEL_NUMBER);
            expect(result[FOUR].channelNumber).toBe(FIFTH_CHANNEL_NUMBER);
        });

        it('should return new array on each call', () => {
            const result1 = makeDefaultTeleportChannels();
            const result2 = makeDefaultTeleportChannels();

            expect(result1).not.toBe(result2);
        });

        it('should return channels with correct structure', () => {
            const result = makeDefaultTeleportChannels();

            result.forEach((channel: TeleportChannel) => {
                expect(typeof channel.channelNumber).toBe('number');
                expect(channel.tiles).toBeUndefined();
            });
        });
    });
});

