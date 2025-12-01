/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from './tracking.service';
import { Position } from '@common/interfaces/position.interface';
import { MapSize } from '@common/enums/map-size.enum';

describe('TrackingService', () => {
    let service: TrackingService;

    const SESSION_ID = 'session-123';
    const SESSION_ID_2 = 'session-456';
    const PLAYER_ID_1 = 'player-1';
    const PLAYER_ID_2 = 'player-2';
    const POSITION_X_1 = 5;
    const POSITION_Y_1 = 10;
    const POSITION_X_2 = 7;
    const POSITION_Y_2 = 12;
    const MAP_SIZE_SMALL = MapSize.SMALL;
    const MAP_SIZE_MEDIUM = MapSize.MEDIUM;
    const MAP_SIZE_LARGE = MapSize.LARGE;
    const TOTAL_DOORS = 5;
    const TOTAL_SANCTUARIES = 3;
    const TOTAL_TELEPORT_TILES = 2;
    const DAMAGE_AMOUNT_1 = 10;
    const DAMAGE_AMOUNT_2 = 20;
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const THREE = 3;
    const EXPECTED_TOTAL_TILES_SMALL = MAP_SIZE_SMALL * MAP_SIZE_SMALL;
    const EXPECTED_TOTAL_TILES_MEDIUM = MAP_SIZE_MEDIUM * MAP_SIZE_MEDIUM;
    const EXPECTED_TOTAL_TILES_LARGE = MAP_SIZE_LARGE * MAP_SIZE_LARGE;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X_1,
        y: POSITION_Y_1,
        ...overrides,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TrackingService],
        }).compile();

        service = module.get<TrackingService>(TrackingService);
    });

    describe('initializeTracking', () => {
        it('should initialize tracking with small map size', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData).not.toBeNull();
            expect(trackingData?.sessionId).toBe(SESSION_ID);
            expect(trackingData?.totalTiles).toBe(EXPECTED_TOTAL_TILES_SMALL);
            expect(trackingData?.totalDoors).toBe(TOTAL_DOORS);
            expect(trackingData?.totalSanctuaries).toBe(TOTAL_SANCTUARIES);
            expect(trackingData?.totalTeleportTiles).toBe(TOTAL_TELEPORT_TILES);
            expect(trackingData?.teleportations).toBe(ZERO);
            expect(trackingData?.playerTiles.size).toBe(ZERO);
            expect(trackingData?.toggledDoors.size).toBe(ZERO);
            expect(trackingData?.usedSanctuaries.size).toBe(ZERO);
            expect(trackingData?.flagHolders.size).toBe(ZERO);
            expect(trackingData?.playerDamage.size).toBe(ZERO);
        });

        it('should initialize tracking with medium map size', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_MEDIUM, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.totalTiles).toBe(EXPECTED_TOTAL_TILES_MEDIUM);
        });

        it('should initialize tracking with large map size', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_LARGE, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.totalTiles).toBe(EXPECTED_TOTAL_TILES_LARGE);
        });

        it('should overwrite existing tracking data', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
            service.trackTeleportation(SESSION_ID);

            service.initializeTracking(SESSION_ID, MAP_SIZE_MEDIUM, TOTAL_DOORS + ONE, TOTAL_SANCTUARIES + ONE, TOTAL_TELEPORT_TILES + ONE);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.totalTiles).toBe(EXPECTED_TOTAL_TILES_MEDIUM);
            expect(trackingData?.totalDoors).toBe(TOTAL_DOORS + ONE);
            expect(trackingData?.totalSanctuaries).toBe(TOTAL_SANCTUARIES + ONE);
            expect(trackingData?.totalTeleportTiles).toBe(TOTAL_TELEPORT_TILES + ONE);
            expect(trackingData?.teleportations).toBe(ZERO);
        });
    });

    describe('trackTileVisited', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track tile visited for a player', () => {
            const position = createMockPosition();

            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerTiles = trackingData?.playerTiles.get(PLAYER_ID_1);
            expect(playerTiles).toBeDefined();
            expect(playerTiles?.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
        });

        it('should track multiple tiles visited for the same player', () => {
            const position1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const position2 = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position1);
            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position2);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerTiles = trackingData?.playerTiles.get(PLAYER_ID_1);
            expect(playerTiles?.size).toBe(TWO);
            expect(playerTiles?.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
            expect(playerTiles?.has(`${POSITION_X_2},${POSITION_Y_2}`)).toBe(true);
        });

        it('should track tiles for multiple players', () => {
            const position1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const position2 = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position1);
            service.trackTileVisited(SESSION_ID, PLAYER_ID_2, position2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.playerTiles.size).toBe(TWO);
            expect(trackingData?.playerTiles.get(PLAYER_ID_1)?.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
            expect(trackingData?.playerTiles.get(PLAYER_ID_2)?.has(`${POSITION_X_2},${POSITION_Y_2}`)).toBe(true);
        });

        it('should not track tile when tracker does not exist', () => {
            const position = createMockPosition();

            service.trackTileVisited('non-existent-session', PLAYER_ID_1, position);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });

        it('should not add duplicate tiles', () => {
            const position = createMockPosition();

            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position);
            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerTiles = trackingData?.playerTiles.get(PLAYER_ID_1);
            expect(playerTiles?.size).toBe(ONE);
        });
    });

    describe('trackTeleportation', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should increment teleportations counter', () => {
            service.trackTeleportation(SESSION_ID);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.teleportations).toBe(ONE);
        });

        it('should increment teleportations counter multiple times', () => {
            service.trackTeleportation(SESSION_ID);
            service.trackTeleportation(SESSION_ID);
            service.trackTeleportation(SESSION_ID);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.teleportations).toBe(THREE);
        });

        it('should not increment teleportations when tracker does not exist', () => {
            service.trackTeleportation('non-existent-session');

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });
    });

    describe('trackDoorToggled', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track door toggled', () => {
            const position = createMockPosition();

            service.trackDoorToggled(SESSION_ID, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.toggledDoors.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
        });

        it('should track multiple doors toggled', () => {
            const position1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const position2 = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            service.trackDoorToggled(SESSION_ID, position1);
            service.trackDoorToggled(SESSION_ID, position2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.toggledDoors.size).toBe(TWO);
            expect(trackingData?.toggledDoors.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
            expect(trackingData?.toggledDoors.has(`${POSITION_X_2},${POSITION_Y_2}`)).toBe(true);
        });

        it('should not track door when tracker does not exist', () => {
            const position = createMockPosition();

            service.trackDoorToggled('non-existent-session', position);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });

        it('should not add duplicate doors', () => {
            const position = createMockPosition();

            service.trackDoorToggled(SESSION_ID, position);
            service.trackDoorToggled(SESSION_ID, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.toggledDoors.size).toBe(ONE);
        });
    });

    describe('trackSanctuaryUsed', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track sanctuary used', () => {
            const position = createMockPosition();

            service.trackSanctuaryUsed(SESSION_ID, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.usedSanctuaries.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
        });

        it('should track multiple sanctuaries used', () => {
            const position1 = createMockPosition({ x: POSITION_X_1, y: POSITION_Y_1 });
            const position2 = createMockPosition({ x: POSITION_X_2, y: POSITION_Y_2 });

            service.trackSanctuaryUsed(SESSION_ID, position1);
            service.trackSanctuaryUsed(SESSION_ID, position2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.usedSanctuaries.size).toBe(TWO);
            expect(trackingData?.usedSanctuaries.has(`${POSITION_X_1},${POSITION_Y_1}`)).toBe(true);
            expect(trackingData?.usedSanctuaries.has(`${POSITION_X_2},${POSITION_Y_2}`)).toBe(true);
        });

        it('should not track sanctuary when tracker does not exist', () => {
            const position = createMockPosition();

            service.trackSanctuaryUsed('non-existent-session', position);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });

        it('should not add duplicate sanctuaries', () => {
            const position = createMockPosition();

            service.trackSanctuaryUsed(SESSION_ID, position);
            service.trackSanctuaryUsed(SESSION_ID, position);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.usedSanctuaries.size).toBe(ONE);
        });
    });

    describe('trackFlagHolder', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track flag holder', () => {
            service.trackFlagHolder(SESSION_ID, PLAYER_ID_1);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.flagHolders.has(PLAYER_ID_1)).toBe(true);
        });

        it('should track multiple flag holders', () => {
            service.trackFlagHolder(SESSION_ID, PLAYER_ID_1);
            service.trackFlagHolder(SESSION_ID, PLAYER_ID_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.flagHolders.size).toBe(TWO);
            expect(trackingData?.flagHolders.has(PLAYER_ID_1)).toBe(true);
            expect(trackingData?.flagHolders.has(PLAYER_ID_2)).toBe(true);
        });

        it('should not track flag holder when tracker does not exist', () => {
            service.trackFlagHolder('non-existent-session', PLAYER_ID_1);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });

        it('should not add duplicate flag holders', () => {
            service.trackFlagHolder(SESSION_ID, PLAYER_ID_1);
            service.trackFlagHolder(SESSION_ID, PLAYER_ID_1);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.flagHolders.size).toBe(ONE);
        });
    });

    describe('trackDamageDealt', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track damage dealt for a player', () => {
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerDamage = trackingData?.playerDamage.get(PLAYER_ID_1);
            expect(playerDamage).toBeDefined();
            expect(playerDamage?.healthDealt).toBe(DAMAGE_AMOUNT_1);
            expect(playerDamage?.healthLost).toBe(ZERO);
        });

        it('should accumulate damage dealt for the same player', () => {
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerDamage = trackingData?.playerDamage.get(PLAYER_ID_1);
            expect(playerDamage?.healthDealt).toBe(DAMAGE_AMOUNT_1 + DAMAGE_AMOUNT_2);
            expect(playerDamage?.healthLost).toBe(ZERO);
        });

        it('should track damage for multiple players', () => {
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_2, DAMAGE_AMOUNT_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.playerDamage.size).toBe(TWO);
            expect(trackingData?.playerDamage.get(PLAYER_ID_1)?.healthDealt).toBe(DAMAGE_AMOUNT_1);
            expect(trackingData?.playerDamage.get(PLAYER_ID_2)?.healthDealt).toBe(DAMAGE_AMOUNT_2);
        });

        it('should not track damage when tracker does not exist', () => {
            service.trackDamageDealt('non-existent-session', PLAYER_ID_1, DAMAGE_AMOUNT_1);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });
    });

    describe('trackDamageReceived', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should track damage received for a player', () => {
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerDamage = trackingData?.playerDamage.get(PLAYER_ID_1);
            expect(playerDamage).toBeDefined();
            expect(playerDamage?.healthLost).toBe(DAMAGE_AMOUNT_1);
            expect(playerDamage?.healthDealt).toBe(ZERO);
        });

        it('should accumulate damage received for the same player', () => {
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerDamage = trackingData?.playerDamage.get(PLAYER_ID_1);
            expect(playerDamage?.healthLost).toBe(DAMAGE_AMOUNT_1 + DAMAGE_AMOUNT_2);
            expect(playerDamage?.healthDealt).toBe(ZERO);
        });

        it('should track damage for multiple players', () => {
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_2, DAMAGE_AMOUNT_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData?.playerDamage.size).toBe(TWO);
            expect(trackingData?.playerDamage.get(PLAYER_ID_1)?.healthLost).toBe(DAMAGE_AMOUNT_1);
            expect(trackingData?.playerDamage.get(PLAYER_ID_2)?.healthLost).toBe(DAMAGE_AMOUNT_2);
        });

        it('should not track damage when tracker does not exist', () => {
            service.trackDamageReceived('non-existent-session', PLAYER_ID_1, DAMAGE_AMOUNT_1);

            const trackingData = service.getTrackingData('non-existent-session');
            expect(trackingData).toBeNull();
        });

        it('should track both damage dealt and received for the same player', () => {
            service.trackDamageDealt(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_1);
            service.trackDamageReceived(SESSION_ID, PLAYER_ID_1, DAMAGE_AMOUNT_2);

            const trackingData = service.getTrackingData(SESSION_ID);
            const playerDamage = trackingData?.playerDamage.get(PLAYER_ID_1);
            expect(playerDamage?.healthDealt).toBe(DAMAGE_AMOUNT_1);
            expect(playerDamage?.healthLost).toBe(DAMAGE_AMOUNT_2);
        });
    });

    describe('getTrackingData', () => {
        it('should return null when tracker does not exist', () => {
            const trackingData = service.getTrackingData('non-existent-session');

            expect(trackingData).toBeNull();
        });

        it('should return tracking data when tracker exists', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            const trackingData = service.getTrackingData(SESSION_ID);

            expect(trackingData).not.toBeNull();
            expect(trackingData?.sessionId).toBe(SESSION_ID);
        });

        it('should return different tracking data for different sessions', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
            service.initializeTracking(SESSION_ID_2, MAP_SIZE_MEDIUM, TOTAL_DOORS + ONE, TOTAL_SANCTUARIES + ONE, TOTAL_TELEPORT_TILES + ONE);

            const trackingData1 = service.getTrackingData(SESSION_ID);
            const trackingData2 = service.getTrackingData(SESSION_ID_2);

            expect(trackingData1?.sessionId).toBe(SESSION_ID);
            expect(trackingData2?.sessionId).toBe(SESSION_ID_2);
            expect(trackingData1?.totalTiles).toBe(EXPECTED_TOTAL_TILES_SMALL);
            expect(trackingData2?.totalTiles).toBe(EXPECTED_TOTAL_TILES_MEDIUM);
        });
    });

    describe('removeTracking', () => {
        beforeEach(() => {
            service.initializeTracking(SESSION_ID, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);
        });

        it('should remove tracking data', () => {
            service.removeTracking(SESSION_ID);

            const trackingData = service.getTrackingData(SESSION_ID);
            expect(trackingData).toBeNull();
        });

        it('should not throw error when removing non-existent tracking', () => {
            expect(() => {
                service.removeTracking('non-existent-session');
            }).not.toThrow();
        });

        it('should only remove specified session tracking', () => {
            service.initializeTracking(SESSION_ID_2, MAP_SIZE_SMALL, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            service.removeTracking(SESSION_ID);

            const trackingData1 = service.getTrackingData(SESSION_ID);
            const trackingData2 = service.getTrackingData(SESSION_ID_2);

            expect(trackingData1).toBeNull();
            expect(trackingData2).not.toBeNull();
        });
    });
});

