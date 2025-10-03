import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { AvatarCardComponent } from './avatar-card.component';

describe('AvatarCardComponent', () => {
    let component: AvatarCardComponent;
    let fixture: ComponentFixture<AvatarCardComponent>;
    let playerService: jasmine.SpyObj<PlayerService>;
    let assetsService: jasmine.SpyObj<AssetsService>;
    const testAvatar: AvatarName = AvatarName.Avatar1;

    beforeEach(async () => {
        playerService = jasmine.createSpyObj('PlayerService', ['id', 'selectAvatar']);
        assetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);

        await TestBed.configureTestingModule({
            imports: [AvatarCardComponent],
            providers: [
                { provide: PlayerService, useValue: playerService },
                { provide: AssetsService, useValue: assetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarCardComponent);
        component = fixture.componentInstance;
        component.assignment = { avatarName: testAvatar, chosenBy: null };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return "available" when avatar is not chosen', () => {
        component.assignment = { avatarName: testAvatar, chosenBy: null };
        expect(component.selectionState).toBe('available');
    });

    it('should return "mine" when avatar is chosen by current player', () => {
        const playerId = 'player1';
        playerService.id.and.returnValue(playerId);
        component.assignment = { avatarName: testAvatar, chosenBy: playerId };
        expect(component.selectionState).toBe('mine');
    });

    it('should return "taken" when avatar is chosen by another player', () => {
        playerService.id.and.returnValue('player1');
        component.assignment = { avatarName: testAvatar, chosenBy: 'player2' };
        expect(component.selectionState).toBe('taken');
    });

    it('should call selectAvatar when selecting an available avatar', () => {
        component.assignment = { avatarName: testAvatar, chosenBy: null };
        component.select();
        expect(playerService.selectAvatar).toHaveBeenCalledWith(testAvatar);
    });

    it('should not call selectAvatar when avatar is already taken', () => {
        component.assignment = { avatarName: testAvatar, chosenBy: 'player2' };
        component.select();
        expect(playerService.selectAvatar).not.toHaveBeenCalled();
    });

    it('should get avatar image from assets service', () => {
        const expectedPath = 'path/to/avatar';
        assetsService.getAvatarStaticImage.and.returnValue(expectedPath);
        expect(component.getAvatarImage()).toBe(expectedPath);
        expect(assetsService.getAvatarStaticImage).toHaveBeenCalledWith(testAvatar);
    });
});
