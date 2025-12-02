import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { AvatarAssignment } from '@common/interfaces/session.interface';
import { AvatarCardComponent } from './avatar-card.component';

const TEST_PLAYER_ID = 'test-player-id';
const TEST_OTHER_PLAYER_ID = 'other-player-id';
const TEST_AVATAR_IMAGE_PATH = './assets/images/avatars/static/avatar1.png';
const TEST_AVATAR_IMAGE_PATH_2 = './assets/images/avatars/static/avatar2.png';
const TEST_AVATAR = Avatar.Avatar1;
const TEST_AVATAR_2 = Avatar.Avatar2;

type MockPlayerService = {
    id: Signal<string>;
    selectAvatar: jasmine.Spy;
};

describe('AvatarCardComponent', () => {
    let component: AvatarCardComponent;
    let fixture: ComponentFixture<AvatarCardComponent>;
    let mockPlayerService: MockPlayerService;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let playerIdSignal: ReturnType<typeof signal<string>>;

    beforeEach(async () => {
        playerIdSignal = signal(TEST_PLAYER_ID);
        mockPlayerService = {
            id: playerIdSignal.asReadonly(),
            selectAvatar: jasmine.createSpy('selectAvatar'),
        };

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockAssetsService.getAvatarStaticImage.and.returnValue(TEST_AVATAR_IMAGE_PATH);

        await TestBed.configureTestingModule({
            imports: [AvatarCardComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('selectionState', () => {
        it('should return "available" when chosenBy is null', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: null,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            expect(component.selectionState).toBe('available');
        });

        it('should return "mine" when chosenBy matches current player id', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: TEST_PLAYER_ID,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            expect(component.selectionState).toBe('mine');
        });

        it('should return "taken" when chosenBy is a different player id', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: TEST_OTHER_PLAYER_ID,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            expect(component.selectionState).toBe('taken');
        });
    });

    describe('select', () => {
        it('should call playerService.selectAvatar when selectionState is "available"', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: null,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            component.select();

            expect(mockPlayerService.selectAvatar).toHaveBeenCalledOnceWith(TEST_AVATAR);
        });

        it('should not call playerService.selectAvatar when selectionState is "mine"', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: TEST_PLAYER_ID,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            component.select();

            expect(mockPlayerService.selectAvatar).not.toHaveBeenCalled();
        });

        it('should not call playerService.selectAvatar when selectionState is "taken"', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: TEST_OTHER_PLAYER_ID,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            component.select();

            expect(mockPlayerService.selectAvatar).not.toHaveBeenCalled();
        });
    });

    describe('avatarImage', () => {
        beforeEach(() => {
            mockAssetsService.getAvatarStaticImage.calls.reset();
        });

        it('should return the result from assetsService.getAvatarStaticImage', () => {
            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR,
                chosenBy: null,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR);
            expect(result).toBe(TEST_AVATAR_IMAGE_PATH);
        });

        it('should return different image path for different avatar', () => {
            mockAssetsService.getAvatarStaticImage.and.returnValue(TEST_AVATAR_IMAGE_PATH_2);

            const assignment: AvatarAssignment = {
                avatar: TEST_AVATAR_2,
                chosenBy: null,
            };
            component.assignment = assignment;
            fixture.detectChanges();

            const result = component.avatarImage;

            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(TEST_AVATAR_2);
            expect(result).toBe(TEST_AVATAR_IMAGE_PATH_2);
        });
    });
});
