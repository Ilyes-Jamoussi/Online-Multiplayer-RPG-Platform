import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlagTransferRequestDto } from '@app/dto/flag-transfer-request-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { FlagTransferOverlayComponent } from './flag-transfer-overlay.component';

const MOCK_FROM_PLAYER_ID = 'player1';
const MOCK_TO_PLAYER_ID = 'player2';
const MOCK_FROM_PLAYER_NAME = 'Player One';
const MOCK_AVATAR_PATH = './assets/images/avatars/animated/avatar1.gif';
const MOCK_EMPTY_STRING = '';

describe('FlagTransferOverlayComponent', () => {
    let component: FlagTransferOverlayComponent;
    let fixture: ComponentFixture<FlagTransferOverlayComponent>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let pendingFlagTransferRequestSignal: WritableSignal<FlagTransferRequestDto | null>;

    const mockFromPlayer: Player = {
        id: MOCK_FROM_PLAYER_ID,
        name: MOCK_FROM_PLAYER_NAME,
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 10,
        healthBonus: 0,
        health: 10,
        maxHealth: 10,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        boatSpeedBonus: 0,
        boatSpeed: 0,
        baseAttack: 4,
        attackBonus: 0,
        baseDefense: 4,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
    };

    const mockToPlayer: Player = {
        id: MOCK_TO_PLAYER_ID,
        name: 'Player Two',
        avatar: Avatar.Avatar2,
        isAdmin: false,
        baseHealth: 10,
        healthBonus: 0,
        health: 10,
        maxHealth: 10,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        boatSpeedBonus: 0,
        boatSpeed: 0,
        baseAttack: 4,
        attackBonus: 0,
        baseDefense: 4,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
    };

    const mockFlagTransferRequest: FlagTransferRequestDto = {
        fromPlayerId: MOCK_FROM_PLAYER_ID,
        toPlayerId: MOCK_TO_PLAYER_ID,
        fromPlayerName: MOCK_FROM_PLAYER_NAME,
    };

    beforeEach(async () => {
        pendingFlagTransferRequestSignal = signal<FlagTransferRequestDto | null>(null);

        const inGameServiceSpy = jasmine.createSpyObj('InGameService', ['getPlayerByPlayerId', 'respondToFlagTransfer'], {
            pendingFlagTransferRequest: pendingFlagTransferRequestSignal.asReadonly(),
        });

        const assetsServiceSpy = jasmine.createSpyObj('AssetsService', ['getAvatarAnimatedImage']);

        await TestBed.configureTestingModule({
            imports: [FlagTransferOverlayComponent],
            providers: [
                { provide: InGameService, useValue: inGameServiceSpy },
                { provide: AssetsService, useValue: assetsServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FlagTransferOverlayComponent);
        component = fixture.componentInstance;
        mockInGameService = TestBed.inject(InGameService) as jasmine.SpyObj<InGameService>;
        mockAssetsService = TestBed.inject(AssetsService) as jasmine.SpyObj<AssetsService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('pendingRequest', () => {
        it('should return null when no pending request exists', () => {
            expect(component.pendingRequest).toBeNull();
        });

        it('should return the pending request when it exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            fixture.detectChanges();

            expect(component.pendingRequest).toEqual(mockFlagTransferRequest);
        });
    });

    describe('fromPlayerName', () => {
        it('should return empty string when no pending request exists', () => {
            expect(component.fromPlayerName).toBe(MOCK_EMPTY_STRING);
        });

        it('should return the from player name when pending request exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            fixture.detectChanges();

            expect(component.fromPlayerName).toBe(MOCK_FROM_PLAYER_NAME);
        });
    });

    describe('fromPlayerAvatar', () => {
        it('should return empty string when no pending request exists', () => {
            expect(component.fromPlayerAvatar).toBe(MOCK_EMPTY_STRING);
        });

        it('should return empty string when player is not found', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            mockInGameService.getPlayerByPlayerId.and.returnValue(undefined as unknown as Player);
            fixture.detectChanges();

            expect(component.fromPlayerAvatar).toBe(MOCK_EMPTY_STRING);
        });

        it('should return avatar path when player exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            mockInGameService.getPlayerByPlayerId.and.returnValue(mockFromPlayer);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(MOCK_AVATAR_PATH);
            fixture.detectChanges();

            expect(component.fromPlayerAvatar).toBe(MOCK_AVATAR_PATH);
            expect(mockInGameService.getPlayerByPlayerId).toHaveBeenCalledWith(MOCK_FROM_PLAYER_ID);
            expect(mockAssetsService.getAvatarAnimatedImage).toHaveBeenCalledWith(Avatar.Avatar1);
        });
    });

    describe('toPlayerAvatar', () => {
        it('should return empty string when no pending request exists', () => {
            expect(component.toPlayerAvatar).toBe(MOCK_EMPTY_STRING);
        });

        it('should return empty string when player is not found', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            mockInGameService.getPlayerByPlayerId.and.returnValue(undefined as unknown as Player);
            fixture.detectChanges();

            expect(component.toPlayerAvatar).toBe(MOCK_EMPTY_STRING);
        });

        it('should return avatar path when player exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            mockInGameService.getPlayerByPlayerId.and.returnValue(mockToPlayer);
            mockAssetsService.getAvatarAnimatedImage.and.returnValue(MOCK_AVATAR_PATH);
            fixture.detectChanges();

            expect(component.toPlayerAvatar).toBe(MOCK_AVATAR_PATH);
            expect(mockInGameService.getPlayerByPlayerId).toHaveBeenCalledWith(MOCK_TO_PLAYER_ID);
            expect(mockAssetsService.getAvatarAnimatedImage).toHaveBeenCalledWith(Avatar.Avatar2);
        });
    });

    describe('accept', () => {
        it('should not call respondToFlagTransfer when no pending request exists', () => {
            component.accept();

            expect(mockInGameService.respondToFlagTransfer).not.toHaveBeenCalled();
        });

        it('should call respondToFlagTransfer with true when pending request exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            fixture.detectChanges();

            component.accept();

            expect(mockInGameService.respondToFlagTransfer).toHaveBeenCalledWith(MOCK_FROM_PLAYER_ID, true);
        });
    });

    describe('reject', () => {
        it('should not call respondToFlagTransfer when no pending request exists', () => {
            component.reject();

            expect(mockInGameService.respondToFlagTransfer).not.toHaveBeenCalled();
        });

        it('should call respondToFlagTransfer with false when pending request exists', () => {
            pendingFlagTransferRequestSignal.set(mockFlagTransferRequest);
            fixture.detectChanges();

            component.reject();

            expect(mockInGameService.respondToFlagTransfer).toHaveBeenCalledWith(MOCK_FROM_PLAYER_ID, false);
        });
    });
});