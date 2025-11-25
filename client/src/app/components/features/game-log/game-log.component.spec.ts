import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIcons } from '@app/enums/fa-icons.enum';
import { GameLogService } from '@app/services/game-log/game-log.service';
import { GameLogEventType } from '@common/enums/game-log-event-type.enum';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';
import { GameLogComponent } from './game-log.component';

// Test constants
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

const createMockGameLogEntry = (
    id: string,
    timestamp: string,
    message: string,
    icon?: string,
): GameLogEntry => ({
    id,
    timestamp,
    type: GameLogEventType.TurnStart,
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
            // The method checks if icon is a key in FaIcons enum
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
            // FaIcons.User = 'user', but 'user' is not a key, it's a value
            const iconValue = FaIcons.User; // This is 'user'
            const result = component.getIconName(iconValue);
            expect(result).toBeUndefined();
        });
    });

    describe('ngAfterViewChecked', () => {
        it('should call scrollToBottom when entries length changes', () => {
            // Create a fresh component instance to ensure clean state
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            // Initially entries is empty - this initializes previousEntriesLength to 0
            entriesSignal.set([]);
            // Don't call detectChanges() here to avoid triggering ngAfterViewChecked prematurely
            // Instead, call ngAfterViewChecked manually to initialize previousEntriesLength
            freshComponent.ngAfterViewChecked();
            // Now previousEntriesLength should be 0

            // Reset scrollTop to ensure we can detect the change
            mockElement.scrollTop = 0;

            // Add an entry to change the length from 0 to 1
            const entry = createMockGameLogEntry(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            // Now call ngAfterViewChecked manually to detect the change
            // Since previousEntriesLength (0) !== currentLength (1), scrollToBottom should be called
            freshComponent.ngAfterViewChecked();

            // Verify scroll happened
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not call scrollToBottom when entries length does not change', () => {
            // Create a fresh component instance to ensure clean state
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            // Initialize with empty entries - set previousEntriesLength to 0
            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();
            // Now previousEntriesLength should be 0

            // Add an entry to change length from 0 to 1
            const entry = createMockGameLogEntry(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            freshComponent.ngAfterViewChecked();
            // This should detect the change (0 -> 1) and call scrollToBottom(), setting previousEntriesLength to 1

            // Verify scroll happened on first change
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);

            // Now test that calling ngAfterViewChecked again without changing entries doesn't scroll
            // Reset scrollTop to a known value
            mockElement.scrollTop = 0;

            // Ensure entries length hasn't changed - it should still be 1
            expect(entriesSignal().length).toBe(1);

            // Call ngAfterViewChecked multiple times to ensure it doesn't scroll when length hasn't changed
            // Since previousEntriesLength (1) === currentLength (1), scrollToBottom should not be called
            freshComponent.ngAfterViewChecked();
            const scrollTopAfterFirstCall = mockElement.scrollTop;

            freshComponent.ngAfterViewChecked();
            const scrollTopAfterSecondCall = mockElement.scrollTop;

            // scrollTop should remain unchanged (still 0, not SCROLL_HEIGHT_VALUE)
            // Both calls should result in the same scrollTop value
            expect(scrollTopAfterFirstCall).toBe(0);
            expect(scrollTopAfterSecondCall).toBe(0);
            expect(mockElement.scrollTop).toBe(0);
        });

        it('should update previousEntriesLength when entries length changes', () => {
            // Create a fresh component instance to ensure clean state
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            // Start with one entry - initialize previousEntriesLength to 0 first
            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();
            // Now previousEntriesLength should be 0

            // Add first entry to change length from 0 to 1
            const entry1 = createMockGameLogEntry(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry1]);
            freshComponent.ngAfterViewChecked();
            // This should detect the change (0 -> 1) and call scrollToBottom(), setting previousEntriesLength to 1

            // Verify scroll happened on first change
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);

            // Reset scrollTop
            mockElement.scrollTop = 0;

            // Add another entry to change length from 1 to 2
            const entry2 = createMockGameLogEntry(TEST_ENTRY_ID_2, TEST_TIMESTAMP_2, TEST_MESSAGE_2);
            entriesSignal.set([entry1, entry2]);
            // Call ngAfterViewChecked manually to detect the change (1 -> 2)
            freshComponent.ngAfterViewChecked();

            // Should scroll again because length changed from 1 to 2
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });
    });

    describe('scrollToBottom', () => {
        it('should scroll to bottom when entriesContainer exists', () => {
            // Create a fresh component instance to ensure clean state
            const freshFixture = TestBed.createComponent(GameLogComponent);
            const freshComponent = freshFixture.componentInstance;

            const mockElement = {
                scrollTop: 0,
                scrollHeight: SCROLL_HEIGHT_VALUE,
            };

            (freshComponent as unknown as { entriesContainer: { nativeElement: typeof mockElement } }).entriesContainer = {
                nativeElement: mockElement,
            };

            // Start with empty entries - initialize previousEntriesLength to 0
            entriesSignal.set([]);
            freshComponent.ngAfterViewChecked();
            // Now previousEntriesLength should be 0

            // Reset scrollTop to ensure we can detect the change
            mockElement.scrollTop = 0;

            // Now add an entry to change the length from 0 to 1
            const entry = createMockGameLogEntry(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            // Call ngAfterViewChecked manually to detect the change (0 -> 1)
            freshComponent.ngAfterViewChecked();

            // Verify scroll happened
            expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT_VALUE);
        });

        it('should not throw error when entriesContainer is undefined', () => {
            (component as unknown as { entriesContainer: undefined }).entriesContainer = undefined;

            // Trigger scroll attempt by changing entries length
            const entry = createMockGameLogEntry(TEST_ENTRY_ID_1, TEST_TIMESTAMP_1, TEST_MESSAGE_1);
            entriesSignal.set([entry]);
            fixture.detectChanges();

            // Should not throw error
            expect(() => component.ngAfterViewChecked()).not.toThrow();
        });
    });
});
