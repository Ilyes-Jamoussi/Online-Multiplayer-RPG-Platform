import { GAME_PREVIEW_PROJECTION, GAME_PROJECTION, LIVE_SESSION_PROJECTION, VISIBILITY_PROJECTION } from '@app/constants/mongo-projections.constants';
import { getProjection } from './mongo.util';

describe('MongoUtils', () => {
    describe('getProjection', () => {
        it('should return game projection for gameDto', () => {
            expect(getProjection('gameDto')).toEqual(GAME_PROJECTION);
        });

        it('should return preview projection for displayGameDto', () => {
            expect(getProjection('displayGameDto')).toEqual(GAME_PREVIEW_PROJECTION);
        });

        it('should return visibility projection for visibilityDto', () => {
            expect(getProjection('visibilityDto')).toEqual(VISIBILITY_PROJECTION);
        });

        it('should return live session projection for liveSessionDto', () => {
            expect(getProjection('liveSessionDto')).toEqual(LIVE_SESSION_PROJECTION);
        });
    });
});
