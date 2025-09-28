import { TestBed } from '@angular/core/testing';

import { UI_CONSTANTS } from '@app/constants/ui.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MAP_SIZE_TO_MAX_PLAYERS, MapSize } from '@common/enums/map-size.enum';
import { GameParametersService } from './game-parameters.service';

describe('GameParametersService', () => {
    let service: GameParametersService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameParametersService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('default values', () => {
        it('should default mapSize to MEDIUM', () => {
            expect(service.mapSize).toBe(MapSize.MEDIUM);
        });

        it('should default gameMode to CLASSIC', () => {
            expect(service.gameMode).toBe(GameMode.CLASSIC);
        });

        it('should default gameName and description to empty strings', () => {
            expect(service.gameName).toBe('');
            expect(service.gameDescription).toBe('');
        });
    });

    describe('setters and getters', () => {
        it('setMapSize should change mapSize and remain consistent with MAP_SIZE_TO_MAX_PLAYERS keys', () => {
            const sizes = Object.values(MapSize).filter((v) => typeof v === 'number') as MapSize[];
            sizes.forEach((size) => {
                service.setMapSize(size);
                expect(service.mapSize).toBe(size);

                expect(MAP_SIZE_TO_MAX_PLAYERS[size]).toBeDefined();
                expect(typeof MAP_SIZE_TO_MAX_PLAYERS[size]).toBe('number');
            });
        });

        it('setGameMode should change gameMode for all defined modes', () => {
            const modes = Object.values(GameMode) as GameMode[];
            modes.forEach((mode) => {
                service.setGameMode(mode);
                expect(service.gameMode).toBe(mode);
            });
        });

        it('setGameName should change gameName using UI_CONSTANTS to avoid magic strings', () => {
            const base36 = UI_CONSTANTS.select.base36;
            const multiplier = UI_CONSTANTS.select.randomMultiplier;
            const testName = `game-${base36}-${multiplier}`;
            service.setGameName(testName);
            expect(service.gameName).toBe(testName);
        });

        it('setGameDescription should change gameDescription using UI_CONSTANTS values', () => {
            const { initialX, initialY } = UI_CONSTANTS.draggablePanel;
            const description = `desc-${initialX}-${initialY}`;
            service.setGameDescription(description);
            expect(service.gameDescription).toBe(description);
        });
    });
});
