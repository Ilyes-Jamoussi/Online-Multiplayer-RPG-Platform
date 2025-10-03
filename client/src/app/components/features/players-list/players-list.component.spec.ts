import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SessionService } from '@app/services/session/session.service';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { DiceType } from '@common/enums/dice-type.enum';
import { Player } from '@common/models/player.model';
import { PlayersListComponent } from './players-list.component';

@Component({
    selector: 'app-player-card',
    template: '',
    standalone: true,
})
class MockPlayerCardComponent {}

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let sessionService: jasmine.SpyObj<SessionService>;
    const playersSignal = signal<Player[]>([]);
    const isRoomLockedSignal = signal<boolean>(false);

    const mockPlayers: Player[] = [
        {
            id: '1',
            name: 'Player 1',
            avatar: AvatarName.Avatar1,
            isAdmin: true,
            maxHp: 10,
            currentHp: 10,
            speed: 3,
            attack: 3,
            defense: 3,
            attackDice: DiceType.D4,
            defenseDice: DiceType.D4,
            remainingMoves: 3,
            remainingActions: 1,
            remainingLives: 3,
            combatsWon: 0,
            isActive: false,
            hasAbandoned: false,
            inventory: [],
            startingPoint: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
        },
        {
            id: '2',
            name: 'Player 2',
            avatar: AvatarName.Avatar2,
            isAdmin: false,
            maxHp: 10,
            currentHp: 10,
            speed: 3,
            attack: 3,
            defense: 3,
            attackDice: DiceType.D4,
            defenseDice: DiceType.D4,
            remainingMoves: 3,
            remainingActions: 1,
            remainingLives: 3,
            combatsWon: 0,
            isActive: false,
            hasAbandoned: false,
            inventory: [],
            startingPoint: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
        },
    ];

    beforeEach(async () => {
        playersSignal.set(mockPlayers);
        sessionService = jasmine.createSpyObj('SessionService', [], {
            players: playersSignal,
            isRoomLocked: isRoomLockedSignal,
        });

        await TestBed.configureTestingModule({
            imports: [PlayersListComponent, MockPlayerCardComponent],
            providers: [{ provide: SessionService, useValue: sessionService }],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get players from session service', () => {
        expect(component.players()).toBe(mockPlayers);
    });

    it('should get room locked status from session service', () => {
        expect(component.isRoomLocked()).toBe(false);
    });

    it('should render a player card for each player', () => {
        const playerCards = fixture.debugElement.queryAll(By.directive(MockPlayerCardComponent));
        expect(playerCards.length).toBe(mockPlayers.length);
    });

    it('should update when players list changes', () => {
        const updatedPlayers: Player[] = [
            ...mockPlayers,
            {
                id: '3',
                name: 'Player 3',
                avatar: AvatarName.Avatar1,
                isAdmin: false,
                maxHp: 10,
                currentHp: 10,
                speed: 3,
                attack: 3,
                defense: 3,
                attackDice: DiceType.D4,
                defenseDice: DiceType.D4,
                remainingMoves: 3,
                remainingActions: 1,
                remainingLives: 3,
                combatsWon: 0,
                isActive: false,
                hasAbandoned: false,
                inventory: [],
                startingPoint: { x: 0, y: 0 },
                currentPosition: { x: 0, y: 0 },
            },
        ];

        playersSignal.set(updatedPlayers);
        fixture.detectChanges();

        const playerCards = fixture.debugElement.queryAll(By.directive(MockPlayerCardComponent));
        expect(playerCards.length).toBe(updatedPlayers.length);
    });

    it('should update when room locked status changes', () => {
        isRoomLockedSignal.set(true);
        fixture.detectChanges();
        expect(component.isRoomLocked()).toBe(true);
    });
});
