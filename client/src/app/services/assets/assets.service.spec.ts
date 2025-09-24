import { TestBed } from '@angular/core/testing';
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

    it('should return static avatar image path by number', () => {
        const result = service.getAvatarStaticByNumber(1);
        expect(result).toContain('avatars/static/avatarS1.png');
    });

    it('should return animated avatar image path by number', () => {
        const result = service.getAvatarAnimatedByNumber(1);
        expect(result).toContain('avatars/animated/avatar1.gif');
    });

    it('should return dice image path', () => {
        const result = service.getDiceImage('D4');
        expect(result).toContain('dice/d4.svg');
    });
});
