import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { AvatarAssignment } from '@common/interfaces/session.interface';
import { AvatarGridComponent } from './avatar-grid.component';

const TEST_AVATAR_ANIMATED_PATH = './assets/images/avatars/animated/avatar1.gif';
const TEST_AVATAR_ANIMATED_PATH_2 = './assets/images/avatars/animated/avatar2.gif';
const TEST_AVATAR_STATIC_PATH = './assets/images/avatars/static/avatar1.png';
const TEST_AVATAR_STATIC_PATH_2 = './assets/images/avatars/static/avatar2.png';
const TEST_AVATAR = Avatar.Avatar1;
const TEST_AVATAR_2 = Avatar.Avatar2;
const TEST_PLAYER_ID = 'test-player-id';
const TEST_OTHER_PLAYER_ID = 'other-player-id';
const EMPTY_STRING = '';

type MockSessionService = {
    avatarAssignments: Signal<AvatarAssignment[]>;
};

type MockPlayerService = {
    avatar: Signal<Avatar | null>;
    id: Signal<string>;
    selectAvatar: jasmine.Spy;
};

describe('AvatarGridComponent', () => {
    let component: AvatarGridComponent;
    let fixture: ComponentFixture<AvatarGridComponent>;
    let mockSessionService: MockSessionService;
    let mockPlayerService: MockPlayerService;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let avatarAssignmentsSignal: ReturnType<typeof signal<AvatarAssignment[]>>;
    let avatarSignal: ReturnType<typeof signal<Avatar | null>>;

    beforeEach(async () => {
        avatarAssignmentsSignal = signal<AvatarAssignment[]>([
            {
                avatar: TEST_AVATAR,
                chosenBy: null,
            },
            {
                avatar: TEST_AVATAR_2,
                chosenBy: TEST_PLAYER_ID,
            },
        ]);

        avatarSignal = signal<Avatar | null>(TEST_AVATAR);
        const playerIdSignal = signal<string>(TEST_PLAYER_ID);

        mockSessionService = {
            avatarAssignments: avatarAssignmentsSignal.asReadonly(),
        };

        mockPlayerService = {
            avatar: avatarSignal.asReadonly(),
            id: playerIdSignal.asReadonly(),
            selectAvatar: jasmine.createSpy('selectAvatar'),
        };

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarAnimatedImage', 'getAvatarStaticImage']);
        mockAssetsService.getAvatarAnimatedImage.and.returnValue(TEST_AVATAR_ANIMATED_PATH);
        mockAssetsService.getAvatarStaticImage.and.callFake((avatar: Avatar | null) => {
            if (avatar === TEST_AVATAR) return TEST_AVATAR_STATIC_PATH;
            if (avatar === TEST_AVATAR_2) return TEST_AVATAR_STATIC_PATH_2;
            return EMPTY_STRING;
        });

        await TestBed.configureTestingModule({
            imports: [AvatarGridComponent],
            providers: [
                { provide: SessionService, useValue: mockSessionService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarGridComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('assignments', () => {
        it('should return avatar assignments from sessionService', () => {
            fixture.detectChanges();

            const result = component.assignments;

            expect(result).toEqual([
                {
                    avatar: TEST_AVATAR,
                    chosenBy: null,
                },
                {
                    avatar: TEST_AVATAR_2,
                    chosenBy: TEST_PLAYER_ID,
                },
            ]);
        });

        it('should return empty array when sessionService has no assignments', () => {
            avatarAssignmentsSignal.set([]);
            fixture.detectChanges();

            const result = component.assignments;

            expect(result).toEqual([]);
        });

        it('should reflect changes in sessionService assignments', () => {
            fixture.detectChanges();

            const initialAssignments = component.assignments;
            expect(initialAssignments.length).toBe(2);

            const newAssignments: AvatarAssignment[] = [
                {
                    avatar: TEST_AVATAR,
                    chosenBy: TEST_OTHER_PLAYER_ID,
                },
            ];
            avatarAssignmentsSignal.set(newAssignments);
            fixture.detectChanges();

            const updatedAssignments = component.assignments;
            expect(updatedAssignments).toEqual(newAssignments);
            expect(updatedAssignments.length).toBe(1);
        });
    });

    describe('selectedAvatar', () => {
        it('should return avatar from playerService when avatar is selected', () => {
            avatarSignal.set(TEST_AVATAR);
            fixture.detectChanges();

            const result = component.selectedAvatar;

            expect(result).toBe(TEST_AVATAR);
        });

        it('should return null when no avatar is selected', () => {
            avatarSignal.set(null);
            fixture.detectChanges();

            const result = component.selectedAvatar;

            expect(result).toBeNull();
        });

        it('should return different avatar when playerService avatar changes', () => {
            avatarSignal.set(TEST_AVATAR);
            fixture.detectChanges();

            expect(component.selectedAvatar).toBe(TEST_AVATAR);

            avatarSignal.set(TEST_AVATAR_2);
            fixture.detectChanges();

            expect(component.selectedAvatar).toBe(TEST_AVATAR_2);
        });
    });

    describe('animatedAvatar', () => {
        beforeEach(() => {
            mockAssetsService.getAvatarAnimatedImage.calls.reset();
        });

        it('should return animated image path when avatar is selected', () => {
            avatarSignal.set(TEST_AVATAR);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(TEST_AVATAR_ANIMATED_PATH);
            fixture.detectChanges();

            const result = component.animatedAvatar;

            expect(mockAssetsService.getAvatarAnimatedImage).toHaveBeenCalledWith(TEST_AVATAR);
            expect(result).toBe(TEST_AVATAR_ANIMATED_PATH);
        });

        it('should return null when no avatar is selected', () => {
            avatarSignal.set(null);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(EMPTY_STRING);
            fixture.detectChanges();

            const result = component.animatedAvatar;

            expect(mockAssetsService.getAvatarAnimatedImage).toHaveBeenCalledWith(null);
            expect(result).toBe(EMPTY_STRING);
        });

        it('should return different animated image path for different avatar', () => {
            avatarSignal.set(TEST_AVATAR_2);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(TEST_AVATAR_ANIMATED_PATH_2);
            fixture.detectChanges();

            const result = component.animatedAvatar;

            expect(mockAssetsService.getAvatarAnimatedImage).toHaveBeenCalledWith(TEST_AVATAR_2);
            expect(result).toBe(TEST_AVATAR_ANIMATED_PATH_2);
        });

        it('should update animated avatar when selected avatar changes', () => {
            avatarSignal.set(TEST_AVATAR);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(TEST_AVATAR_ANIMATED_PATH);
            fixture.detectChanges();

            expect(component.animatedAvatar).toBe(TEST_AVATAR_ANIMATED_PATH);

            avatarSignal.set(TEST_AVATAR_2);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(TEST_AVATAR_ANIMATED_PATH_2);
            fixture.detectChanges();

            expect(component.animatedAvatar).toBe(TEST_AVATAR_ANIMATED_PATH_2);
        });
    });
});
