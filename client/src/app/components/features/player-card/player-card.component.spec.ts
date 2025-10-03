import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { PlayerService } from '@app/services/player/player.service';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { DiceType } from '@common/enums/dice-type.enum';
import { Player } from '@common/models/player.model';
import { PlayerCardComponent } from './player-card.component';

describe('PlayerCardComponent', () => {
    let component: PlayerCardComponent;
    let fixture: ComponentFixture<PlayerCardComponent>;
    let playerService: jasmine.SpyObj<PlayerService>;
    let assetsService: jasmine.SpyObj<AssetsService>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
        avatar: AvatarName.Avatar1,
        isAdmin: false,
        maxHp: 10,
        currentHp: 10,
        speed: 4,
        attack: 4,
        defense: 4,
        attackDice: DiceType.D4,
        defenseDice: DiceType.D4,
        inventory: [],
        remainingMoves: 4,
        remainingActions: 1,
        remainingLives: 3,
        combatsWon: 0,
        isActive: true,
        hasAbandoned: false,
        startingPoint: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
    };

    beforeEach(async () => {
        playerService = jasmine.createSpyObj('PlayerService', ['id', 'isAdmin']);
        playerService.id.and.returnValue('player2');
        playerService.isAdmin.and.returnValue(false);
        assetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);

        await TestBed.configureTestingModule({
            imports: [PlayerCardComponent],
            providers: [
                { provide: PlayerService, useValue: playerService },
                { provide: AssetsService, useValue: assetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerCardComponent);
        component = fixture.componentInstance;
        component.player = { ...mockPlayer };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('isMe', () => {
        it('should return false when player id is different from current player', () => {
            expect(component.isMe).toBeFalse();
        });

        it('should return true when player id matches current player', () => {
            playerService.id.and.returnValue('player1');
            expect(component.isMe).toBeTrue();
        });
    });

    describe('isAdmin', () => {
        it('should return false when player is not admin', () => {
            expect(component.isAdmin).toBeFalse();
        });

        it('should return true when player is admin', () => {
            component.player.isAdmin = true;
            expect(component.isAdmin).toBeTrue();
        });
    });

    describe('cardClasses', () => {
        it('should return correct classes for regular player', () => {
            expect(component.cardClasses).toEqual({
                me: false,
                admin: false,
            });
        });

        it('should return correct classes for current player', () => {
            playerService.id.and.returnValue('player1');
            expect(component.cardClasses).toEqual({
                me: true,
                admin: false,
            });
        });

        it('should return correct classes for admin player', () => {
            component.player.isAdmin = true;
            expect(component.cardClasses).toEqual({
                me: false,
                admin: true,
            });
        });
    });

    describe('showKickButton', () => {
        it('should return false when current player is not admin', () => {
            expect(component.showKickButton).toBeFalse();
        });

        it('should return true when current player is admin and player is not admin', () => {
            playerService.isAdmin.and.returnValue(true);
            expect(component.showKickButton).toBeTrue();
        });

        it('should return false when current player is admin but player is also admin', () => {
            playerService.isAdmin.and.returnValue(true);
            component.player.isAdmin = true;
            expect(component.showKickButton).toBeFalse();
        });
    });

    describe('getAvatarImage', () => {
        it('should get avatar image from assets service', () => {
            const expectedPath = 'path/to/avatar';
            assetsService.getAvatarStaticImage.and.returnValue(expectedPath);
            expect(component.getAvatarImage()).toBe(expectedPath);
            expect(assetsService.getAvatarStaticImage).toHaveBeenCalledWith(component.player.avatar);
        });
    });
});
