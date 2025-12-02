import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, Signal } from '@angular/core';
import { PlaceableLabel } from '@app/enums/placeable-label.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { SanctuaryActionSuccessDto } from '@app/dto/sanctuary-action-success-dto';
import { SanctuaryOverlayComponent } from './sanctuary-overlay.component';

const TEST_X_COORDINATE = 5;
const TEST_Y_COORDINATE = 10;
const TEST_ADDED_HEALTH = 3;
const TEST_ADDED_ATTACK = 2;
const TEST_ADDED_DEFENSE = 1;
const TEST_PLACEABLE_IMAGE_PATH_HEAL = './assets/images/placeables/heal.png';
const TEST_PLACEABLE_IMAGE_PATH_FIGHT = './assets/images/placeables/fight.png';
const TEST_EMPTY_STRING = '';
const TEST_SUCCESS_TRUE = true;
const TEST_SUCCESS_FALSE = false;
const TEST_DOUBLE_ACTION_TRUE = true;
const TEST_DOUBLE_ACTION_FALSE = false;
const HEAL_RESULT_MESSAGE_PREFIX = '+';
const HEAL_RESULT_MESSAGE_SUFFIX = ' points de vie';
const FIGHT_ATTACK_PREFIX = '+';
const FIGHT_ATTACK_SUFFIX = ' attaque';
const FIGHT_DEFENSE_PREFIX = '+';
const FIGHT_DEFENSE_SUFFIX = ' défense';
const FIGHT_PARTS_SEPARATOR = ' et ';

type OpenedSanctuary = SanctuaryActionSuccessDto | null;

type MockInGameService = {
    openedSanctuary: Signal<OpenedSanctuary>;
    performSanctuaryAction: jasmine.Spy;
    closeSanctuary: jasmine.Spy;
};

type MockAssetsService = {
    getPlaceableImage: jasmine.Spy;
};

const CREATE_MOCK_SANCTUARY = (
    kind: PlaceableKind,
    success: boolean = TEST_SUCCESS_FALSE,
    addedHealth?: number,
    addedAttack?: number,
    addedDefense?: number,
): SanctuaryActionSuccessDto => ({
    kind,
    x: TEST_X_COORDINATE,
    y: TEST_Y_COORDINATE,
    success,
    addedHealth,
    addedAttack,
    addedDefense,
});

describe('SanctuaryOverlayComponent', () => {
    let component: SanctuaryOverlayComponent;
    let fixture: ComponentFixture<SanctuaryOverlayComponent>;
    let mockInGameService: MockInGameService;
    let mockAssetsService: MockAssetsService;
    let openedSanctuarySignal: ReturnType<typeof signal<OpenedSanctuary>>;

    beforeEach(async () => {
        openedSanctuarySignal = signal<OpenedSanctuary>(null);

        mockInGameService = {
            openedSanctuary: openedSanctuarySignal.asReadonly(),
            performSanctuaryAction: jasmine.createSpy('performSanctuaryAction'),
            closeSanctuary: jasmine.createSpy('closeSanctuary'),
        };

        mockAssetsService = {
            getPlaceableImage: jasmine.createSpy('getPlaceableImage').and.callFake((kind: PlaceableKind) => {
                if (kind === PlaceableKind.HEAL) return TEST_PLACEABLE_IMAGE_PATH_HEAL;
                if (kind === PlaceableKind.FIGHT) return TEST_PLACEABLE_IMAGE_PATH_FIGHT;
                return TEST_EMPTY_STRING;
            }),
        };

        await TestBed.configureTestingModule({
            imports: [SanctuaryOverlayComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SanctuaryOverlayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('openedSanctuary', () => {
        it('should return openedSanctuary from inGameService', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.openedSanctuary;

            expect(result).toEqual(mockSanctuary);
        });

        it('should return null when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.openedSanctuary;

            expect(result).toBeNull();
        });

        it('should reflect changes in inGameService openedSanctuary', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            expect(component.openedSanctuary).toBeNull();

            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            expect(component.openedSanctuary).toEqual(mockSanctuary);
        });
    });

    describe('sanctuaryImage', () => {
        it('should return empty string when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.sanctuaryImage;

            expect(result).toBe(TEST_EMPTY_STRING);
            expect(mockAssetsService.getPlaceableImage).not.toHaveBeenCalled();
        });

        it('should return image path for HEAL sanctuary', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.sanctuaryImage;

            expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.HEAL);
            expect(result).toBe(TEST_PLACEABLE_IMAGE_PATH_HEAL);
        });

        it('should return image path for FIGHT sanctuary', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.sanctuaryImage;

            expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.FIGHT);
            expect(result).toBe(TEST_PLACEABLE_IMAGE_PATH_FIGHT);
        });
    });

    describe('sanctuaryName', () => {
        it('should return empty string when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.sanctuaryName;

            expect(result).toBe(TEST_EMPTY_STRING);
        });

        it('should return label for HEAL sanctuary', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.sanctuaryName;

            expect(result).toBe(PlaceableLabel.HEAL);
        });

        it('should return label for FIGHT sanctuary', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.sanctuaryName;

            expect(result).toBe(PlaceableLabel.FIGHT);
        });
    });

    describe('isHeal', () => {
        it('should return true when sanctuary kind is HEAL', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.isHeal;

            expect(result).toBe(true);
        });

        it('should return false when sanctuary kind is not HEAL', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.isHeal;

            expect(result).toBe(false);
        });

        it('should return false when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.isHeal;

            expect(result).toBe(false);
        });
    });

    describe('isFight', () => {
        it('should return true when sanctuary kind is FIGHT', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.isFight;

            expect(result).toBe(true);
        });

        it('should return false when sanctuary kind is not FIGHT', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.isFight;

            expect(result).toBe(false);
        });

        it('should return false when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.isFight;

            expect(result).toBe(false);
        });
    });

    describe('hasResult', () => {
        it('should return true when success is true', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_TRUE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.hasResult;

            expect(result).toBe(true);
        });

        it('should return false when success is false', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_FALSE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.hasResult;

            expect(result).toBe(false);
        });

        it('should return false when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.hasResult;

            expect(result).toBe(false);
        });
    });

    describe('showActions', () => {
        it('should return true when success is false', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_FALSE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.showActions;

            expect(result).toBe(true);
        });

        it('should return false when success is true', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_TRUE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.showActions;

            expect(result).toBe(false);
        });

        it('should return false when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.showActions;

            expect(result).toBe(false);
        });
    });

    describe('resultMessage', () => {
        it('should return empty string when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(TEST_EMPTY_STRING);
        });

        it('should return empty string when hasResult is false', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_FALSE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(TEST_EMPTY_STRING);
        });

        it('should return heal message when isHeal and addedHealth is present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_TRUE, TEST_ADDED_HEALTH);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(`${HEAL_RESULT_MESSAGE_PREFIX}${TEST_ADDED_HEALTH}${HEAL_RESULT_MESSAGE_SUFFIX}`);
        });

        it('should return empty string when isHeal but addedHealth is not present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL, TEST_SUCCESS_TRUE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(TEST_EMPTY_STRING);
        });

        it('should return fight message with attack only when isFight and addedAttack is present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT, TEST_SUCCESS_TRUE, undefined, TEST_ADDED_ATTACK);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(`${FIGHT_ATTACK_PREFIX}${TEST_ADDED_ATTACK}${FIGHT_ATTACK_SUFFIX}`);
        });

        it('should return fight message with defense only when isFight and addedDefense is present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT, TEST_SUCCESS_TRUE, undefined, undefined, TEST_ADDED_DEFENSE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(`${FIGHT_DEFENSE_PREFIX}${TEST_ADDED_DEFENSE}${FIGHT_DEFENSE_SUFFIX}`);
        });

        it('should return fight message with both attack and defense when both are present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT, TEST_SUCCESS_TRUE, undefined, TEST_ADDED_ATTACK, TEST_ADDED_DEFENSE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            const expectedMessage =
                `${FIGHT_ATTACK_PREFIX}${TEST_ADDED_ATTACK}${FIGHT_ATTACK_SUFFIX}` +
                `${FIGHT_PARTS_SEPARATOR}` +
                `${FIGHT_DEFENSE_PREFIX}${TEST_ADDED_DEFENSE}${FIGHT_DEFENSE_SUFFIX}`;
            expect(result).toBe(expectedMessage);
        });

        it('should return empty string when isFight but neither addedAttack nor addedDefense is present', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT, TEST_SUCCESS_TRUE);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            const result = component.resultMessage;

            expect(result).toBe(TEST_EMPTY_STRING);
        });
    });

    describe('performAction', () => {
        it('should call inGameService.performSanctuaryAction with correct parameters when double is false', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.HEAL);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            component.performAction(TEST_DOUBLE_ACTION_FALSE);

            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledTimes(1);
            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledWith(
                TEST_X_COORDINATE,
                TEST_Y_COORDINATE,
                PlaceableKind.HEAL,
                TEST_DOUBLE_ACTION_FALSE,
            );
        });

        it('should call inGameService.performSanctuaryAction with correct parameters when double is true', () => {
            const mockSanctuary = CREATE_MOCK_SANCTUARY(PlaceableKind.FIGHT);
            openedSanctuarySignal.set(mockSanctuary);
            fixture.detectChanges();

            component.performAction(TEST_DOUBLE_ACTION_TRUE);

            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledTimes(1);
            expect(mockInGameService.performSanctuaryAction).toHaveBeenCalledWith(
                TEST_X_COORDINATE,
                TEST_Y_COORDINATE,
                PlaceableKind.FIGHT,
                TEST_DOUBLE_ACTION_TRUE,
            );
        });

        it('should not call inGameService.performSanctuaryAction when no sanctuary is opened', () => {
            openedSanctuarySignal.set(null);
            fixture.detectChanges();

            component.performAction(TEST_DOUBLE_ACTION_FALSE);

            expect(mockInGameService.performSanctuaryAction).not.toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should call inGameService.closeSanctuary', () => {
            fixture.detectChanges();

            component.close();

            expect(mockInGameService.closeSanctuary).toHaveBeenCalledTimes(1);
        });
    });
});

