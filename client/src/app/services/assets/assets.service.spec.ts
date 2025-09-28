import { TestBed } from '@angular/core/testing';
import { AVATAR_ANIMATED_PATH, AVATAR_STATIC_PATH, DICE_PATH } from '@app/constants/assets-paths.constants';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice-type.enum';
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
});
