import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIcons } from '@app/enums/fa-icons.enum';
import { GameLogService } from '@app/services/game-log/game-log.service';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';
import { GameLogComponent } from './game-log.component';

const TEST_ENTRY_ID_1 = 'entry-id-1';
const TEST_ENTRY_ID_2 = 'entry-id-2';
const TEST_TIMESTAMP_1 = '2024-01-01T12:30:45.000Z';
const TEST_TIMESTAMP_2 = '2024-01-01T15:45:30.000Z';
const TEST_MESSAGE_1 = 'Test message 1';
const TEST_MESSAGE_2 = 'Test message 2';
const TEST_INVOLVED_PLAYER_IDS = ['player-1'];
const TEST_INVOLVED_PLAYER_NAMES = ['Player 1'];
const TEST_ICON_INVALID = 'invalid-icon';
const TEST_FILTER_BY_ME_TRUE = true;
const TEST_FILTER_BY_ME_FALSE = false;
const SCROLL_HEIGHT_VALUE = 200;

type MockGameLogService = {
    getFilteredEntries: jasmine.Spy;
    filterByMe: Signal<boolean>;
    toggleFilter: jasmine.Spy;
};

const CREATE_MOCK_GAME_LOG_ENTRY = (
    id: string,
    timestamp: string,
    message: string,
    icon?: string,
): GameLogEntry => ({
    id,
    timestamp,
    type: GameLogEntryType.TurnStart,
    message,
    involvedPlayerIds: TEST_INVOLVED_PLAYER_IDS,
    involvedPlayerNames: TEST_INVOLVED_PLAYER_NAMES,
    icon,
});

describe('GameLogComponent', () => {
    let component: GameLogComponent;
    let fixture: ComponentFixture<GameLogComponent>;
    let mockGameLogService: MockGameLogService;
    let entriesSignal: ReturnType<typeof signal<GameLogEntry[]>>;
    let filterByMeSignal: ReturnType<typeof signal<boolean>>;

    beforeEach(async () => {
        entriesSignal = signal<GameLogEntry[]>([]);
        filterByMeSignal = signal<boolean>(TEST_FILTER_BY_ME_FALSE);

        mockGameLogService = {
            getFilteredEntries: jasmine.createSpy('getFilteredEntries').and.returnValue(entriesSignal.asReadonly()),
            filterByMe: filterByMeSignal.asReadonly(),
            toggleFilter: jasmine.createSpy('toggleFilter'),
        };

        await TestBed.configureTestingModule({
            imports: [GameLogComponent],
            providers: [{ provide: GameLogService, useValue: mockGameLogService }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameLogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('toggleFilter', () => {
        it('should call gameLogService.toggleFilter', () => {
            component.toggleFilter();
            expect(mockGameLogService.toggleFilter).toHaveBeenCalledTimes(1);
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            const formatted = component.formatTime(TEST_TIMESTAMP_1);
            expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
        });

        it('should format different timestamp correctly', () => {
            const formatted = component.formatTime(TEST_TIMESTAMP_2);
            expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
        });

        it('should format time with correct format HH:MM:SS', () => {
            const date = new Date(TEST_TIMESTAMP_1);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const expectedFormat = `${hours}:${minutes}:${seconds}`;

            const formatted = component.formatTime(TEST_TIMESTAMP_1);
            expect(formatted).toBe(expectedFormat);
        });
    });

    describe('filterByMeValue', () => {
        it('should return filterByMe signal from gameLogService', () => {
            filterByMeSignal.set(TEST_FILTER_BY_ME_FALSE);
            fixture.detectChanges();

            const result = component.filterByMeValue;

            expect(result).toBe(filterByMeSignal.asReadonly());
            expect(result()).toBe(TEST_FILTER_BY_ME_FALSE);
        });

        it('should return true when filterByMe is true', () => {
            filterByMeSignal.set(TEST_FILTER_BY_ME_TRUE);
            fixture.detectChanges();

            expect(component.filterByMeValue()).toBe(TEST_FILTER_BY_ME_TRUE);
        });

        it('should return false when filterByMe is false', () => {
            filterByMeSignal.set(TEST_FILTER_BY_ME_FALSE);
            fixture.detectChanges();

            expect(component.filterByMeValue()).toBe(TEST_FILTER_BY_ME_FALSE);
        });
    });

    describe('getIconName', () => {
        it('should return undefined when icon is undefined', () => {
            const result = component.getIconName(undefined);
            expect(result).toBeUndefined();
        });

        it('should return undefined when icon is empty string', () => {
            const result = component.getIconName('');
            expect(result).toBeUndefined();
        });

        it('should return icon name when icon is a valid FaIcons key', () => {
            const validIconKey = 'User';

            const result = component.getIconName(validIconKey);

            expect(result).toBe(validIconKey);
        });

        it('should return icon name for different valid FaIcons key', () => {
            const validIconKey = 'Plus';

            const result = component.getIconName(validIconKey);

            expect(result).toBe(validIconKey);
        });

        it('should return undefined when icon is not a key in FaIcons', () => {
            const result = component.getIconName(TEST_ICON_INVALID);
            expect(result).toBeUndefined();
        });

        it('should return undefined when icon is a FaIcons value but not a key', () => {
            const iconValue = FaIcons.User;
            const result = component.getIconName(iconValue);
            expect(result).toBeUndefined();
        });
    });

    describe('ngAfterViewChecked', () => {
        it('should call scrollToBottom when entries length changes', () => {
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();

            mockElement.scrollTop = 0;

            const entry = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            freshComponent.ngAfterViewChecked();

            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not call scrollToBottom when entries length does not change', () => {
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();

            const entry = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            freshComponent.ngAfterViewChecked();

            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);

            mockElement.scrollTop = 0;

            expect(entriesSignal().length).toBe(1);

            freshComponent.ngAfterViewChecked();
            const scrollTopAfterFirstCall = mockElement.scrollTop;

            freshComponent.ngAfterViewChecked();
            const scrollTopAfterSecondCall = mockElement.scrollTop;

            expect(scrollTopAfterFirstCall).toBe(0);
            expect(scrollTopAfterSecondCall).toBe(0);
            expect(mockElement.scrollTop).toBe(0);
        });

        it('should update previousEntriesLength when entries length changes', () => {
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();

            const entry1 = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry1]);
            freshComponent.ngAfterViewChecked();

            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);

            mockElement.scrollTop = 0;

            const entry2 = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_2, TEST_TIMESTAMP_2, TEST_MESSAGE_2);
            entriesSignal.set([entry1, entry2]);
            freshComponent.ngAfterViewChecked();

            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });
    });

    describe('scrollToBottom', () => {
        it('should scroll to bottom when entriesContainer exists', () => {
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();

            mockElement.scrollTop = 0;

            const entry = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            freshComponent.ngAfterViewChecked();

            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not throw error when entriesContainer is undefined', () => {
            (component as unknown as { entriesContainer: undefined }).entriesContainer = undefined;

            const entry = CREATE_MOCK_GAME_LOG_ENTRY(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            fixture.detectChanges();

            expect(() => component.ngAfterViewChecked()).not.toThrow();
        });
    });
});
