import { TestBed } from '@angular/core/testing';
import { AVATAR_ANIMATED_PATH, AVATAR_STATIC_PATH, DICE_PATH, ITEM_PATH, TILE_PATH } from '@app/constants/assets-paths.constants';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { DiceType } from '@common/enums/dice-type.enum';
import { ItemType } from '@common/enums/item-type.enum';
import { DoorState, TileType } from '@common/enums/tile-type.enum';
import { AssetsService } from './assets.service';

describe('AssetsService', () => {
    let service: AssetsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AssetsService],
        });
        service = TestBed.inject(AssetsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getAvatarStaticImage', () => {
        it('should return empty string when avatar is null', () => {
            expect(service.getAvatarStaticImage(null)).toBe('');
        });

        it('should return correct path for avatar', () => {
            const avatarName = AvatarName.Avatar1;
            const expectedPath = `${AVATAR_STATIC_PATH}/${avatarName.toLowerCase()}.png`;
            expect(service.getAvatarStaticImage(avatarName)).toBe(expectedPath);
        });
    });

    describe('getAvatarAnimatedImage', () => {
        it('should return empty string when avatar is null', () => {
            expect(service.getAvatarAnimatedImage(null)).toBe('');
        });

        it('should return correct path for avatar', () => {
            const avatarName = AvatarName.Avatar1;
            const expectedPath = `${AVATAR_ANIMATED_PATH}/${avatarName.toLowerCase()}.gif`;
            expect(service.getAvatarAnimatedImage(avatarName)).toBe(expectedPath);
        });
    });

    describe('getDiceImage', () => {
        it('should return correct path for dice type', () => {
            const diceType = DiceType.D4;
            const expectedPath = `${DICE_PATH}/${diceType.toLowerCase()}.svg`;
            expect(service.getDiceImage(diceType)).toBe(expectedPath);
        });
    });

    describe('getTileImage', () => {
        it('should return correct path for regular tile', () => {
            const tileType = TileType.Sand;
            const expectedPath = `${TILE_PATH}/${tileType.toLowerCase()}.png`;
            expect(service.getTileImage(tileType)).toBe(expectedPath);
        });

        it('should return correct path for door with state', () => {
            const doorState = DoorState.Open;
            const expectedPath = `${TILE_PATH}/door-${doorState.toLowerCase()}.png`;
            expect(service.getTileImage(TileType.Door, doorState)).toBe(expectedPath);
        });

        it('should return regular path for door without state', () => {
            const expectedPath = `${TILE_PATH}/${TileType.Door.toLowerCase()}.png`;
            expect(service.getTileImage(TileType.Door)).toBe(expectedPath);
        });
    });

    describe('getItemImage', () => {
        it('should return empty string when item type is null', () => {
            expect(service.getItemImage(null)).toBe('');
        });

        it('should return correct path for item type', () => {
            const itemType = ItemType.CriticalHealthAttackBoost;
            const expectedPath = `${ITEM_PATH}/${itemType.toLowerCase()}.png`;
            expect(service.getItemImage(itemType)).toBe(expectedPath);
        });
    });
});
