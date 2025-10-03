import { TestBed } from '@angular/core/testing';
import { AVATAR_ANIMATED_PATH, AVATAR_STATIC_PATH, DICE_PATH, OBJECT_PATH, TILE_PATH } from '@app/constants/assets-paths.constants';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { AssetsService } from './assets.service';

describe('AssetsService', () => {
    let service: AssetsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AssetsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('avatar paths using enum values', () => {
        it('should return static avatar image path using Avatar enum', () => {
            const avatar = Avatar.Avatar1;
            const result = service.getAvatarStaticImage(avatar);
            expect(result).toContain(AVATAR_STATIC_PATH);
            expect(result).toContain(avatar.toLowerCase());
            expect(result.endsWith('.png')).toBeTrue();
        });

        it('should return animated avatar image path using Avatar enum', () => {
            const avatar = Avatar.Avatar2;
            const result = service.getAvatarAnimatedImage(avatar);
            expect(result).toContain(AVATAR_ANIMATED_PATH);
            expect(result).toContain(avatar.toLowerCase());
            expect(result.endsWith('.gif')).toBeTrue();
        });

        it('should return empty string when avatar is null for static', () => {
            const result = service.getAvatarStaticImage(null);
            expect(result).toBe('');
        });

        it('should return empty string when avatar is null for animated', () => {
            const result = service.getAvatarAnimatedImage(null);
            expect(result).toBe('');
        });
    });

    describe('avatar paths by number', () => {
        it('should return static avatar image path by number using a variable', () => {
            const avatarNumber = 3;
            const result = service.getAvatarStaticByNumber(avatarNumber);
            expect(result).toContain(AVATAR_STATIC_PATH);
            expect(result).toContain(`avatarS${avatarNumber}.png`);
        });

        it('should return animated avatar image path by number using a variable', () => {
            const avatarNumber = 4;
            const result = service.getAvatarAnimatedByNumber(avatarNumber);
            expect(result).toContain(AVATAR_ANIMATED_PATH);
            expect(result).toContain(`avatar${avatarNumber}.gif`);
        });
    });

    describe('dice images', () => {
        it('should return dice image path using Dice enum', () => {
            const dice = Dice.D4;
            const result = service.getDiceImage(dice);
            expect(result).toContain(DICE_PATH);
            expect(result).toContain(dice.toLowerCase());
            expect(result.endsWith('.svg')).toBeTrue();
        });
    });

    describe('tile images', () => {
        it('should return tile image path using a variable', () => {
            const tileKind = TileKind.BASE;
            const result = service.getTileImage(tileKind);
            expect(result).toContain(TILE_PATH);
            expect(result).toContain(tileKind.toLowerCase());
            expect(result.endsWith('.png')).toBeTrue();
        });

        it('should return closed door image path when tile kind is DOOR and opened is false', () => {
            const tileKind = TileKind.DOOR;
            const result = service.getTileImage(tileKind, false);
            expect(result).toContain(TILE_PATH);
            expect(result).toContain('closed-door');
            expect(result.endsWith('.png')).toBeTrue();
        });

        it('should return open door image path when tile kind is DOOR and opened is true', () => {
            const tileKind = TileKind.DOOR;
            const result = service.getTileImage(tileKind, true);
            expect(result).toContain(TILE_PATH);
            expect(result).toContain('opened-door');
            expect(result.endsWith('.png')).toBeTrue();
        });
    });

    describe('object images', () => {
        it('should return object image path using a variable', () => {
            const objectKind = PlaceableKind.START;
            const result = service.getPlaceableImage(objectKind);
            expect(result).toContain(OBJECT_PATH);
            expect(result).toContain(PlaceableKind.START.toLowerCase());
            expect(result.endsWith('.png')).toBeTrue();
        });
    });
});
