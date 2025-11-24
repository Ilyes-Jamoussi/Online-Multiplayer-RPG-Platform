import { TestBed } from '@angular/core/testing';
import { AssetsService } from './assets.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';

describe('AssetsService', () => {
    let service: AssetsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AssetsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getAvatarStaticImage', () => {
        it('should return correct path for valid avatar', () => {
            const result = service.getAvatarStaticImage(Avatar.Avatar1);
            expect(result).toBe('./assets/images/avatars/static/avatar1.png');
        });

        it('should return empty string for null avatar', () => {
            const result = service.getAvatarStaticImage(null);
            expect(result).toBe('');
        });
    });

    describe('getAvatarAnimatedImage', () => {
        it('should return correct path for valid avatar', () => {
            const result = service.getAvatarAnimatedImage(Avatar.Avatar2);
            expect(result).toBe('./assets/images/avatars/animated/avatar2.gif');
        });

        it('should return empty string for null avatar', () => {
            const result = service.getAvatarAnimatedImage(null);
            expect(result).toBe('');
        });
    });

    describe('getDiceImage', () => {
        it('should return correct path for D4', () => {
            const result = service.getDiceImage(Dice.D4);
            expect(result).toBe('./assets/images/dice/d4.svg');
        });

        it('should return correct path for D6', () => {
            const result = service.getDiceImage(Dice.D6);
            expect(result).toBe('./assets/images/dice/d6.svg');
        });
    });

    describe('getTileImage', () => {
        it('should return correct path for base tile', () => {
            const result = service.getTileImage(TileKind.BASE);
            expect(result).toBe('./assets/images/tiles/base.png');
        });

        it('should return correct path for closed door', () => {
            const result = service.getTileImage(TileKind.DOOR, false);
            expect(result).toBe('./assets/images/tiles/closed-door.png');
        });

        it('should return correct path for opened door', () => {
            const result = service.getTileImage(TileKind.DOOR, true);
            expect(result).toBe('./assets/images/tiles/opened-door.png');
        });

        it('should return correct path for door with default opened parameter', () => {
            const result = service.getTileImage(TileKind.DOOR);
            expect(result).toBe('./assets/images/tiles/closed-door.png');
        });

        it('should return correct path for water tile', () => {
            const result = service.getTileImage(TileKind.WATER);
            expect(result).toBe('./assets/images/tiles/water.png');
        });
    });

    describe('getPlaceableImage', () => {
        it('should return correct path for start placeable', () => {
            const result = service.getPlaceableImage(PlaceableKind.START);
            expect(result).toBe('./assets/images/objects/start.png');
        });

        it('should return correct path for flag placeable', () => {
            const result = service.getPlaceableImage(PlaceableKind.FLAG);
            expect(result).toBe('./assets/images/objects/flag.png');
        });
    });
});
