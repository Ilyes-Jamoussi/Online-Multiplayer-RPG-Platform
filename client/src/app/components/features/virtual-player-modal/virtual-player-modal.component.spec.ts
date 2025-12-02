import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { VirtualPlayerModalComponent } from './virtual-player-modal.component';

const TEST_CAN_ADD_VIRTUAL_PLAYER_TRUE = true;
const TEST_CAN_ADD_VIRTUAL_PLAYER_FALSE = false;
const TEST_DEFAULT_CAN_ADD_VIRTUAL_PLAYER = true;

describe('VirtualPlayerModalComponent', () => {
    let component: VirtualPlayerModalComponent;
    let fixture: ComponentFixture<VirtualPlayerModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VirtualPlayerModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualPlayerModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Input: canAddVirtualPlayer', () => {
        it('should have default value of true', () => {
            expect(component.canAddVirtualPlayer).toBe(TEST_DEFAULT_CAN_ADD_VIRTUAL_PLAYER);
        });

        it('should accept canAddVirtualPlayer input', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_FALSE;
            fixture.detectChanges();

            expect(component.canAddVirtualPlayer).toBe(TEST_CAN_ADD_VIRTUAL_PLAYER_FALSE);
        });

        it('should accept different canAddVirtualPlayer input', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_TRUE;
            fixture.detectChanges();

            expect(component.canAddVirtualPlayer).toBe(TEST_CAN_ADD_VIRTUAL_PLAYER_TRUE);
        });
    });

    describe('virtualPlayerType', () => {
        it('should expose VirtualPlayerType enum', () => {
            expect(component.virtualPlayerType).toBe(VirtualPlayerType);
        });
    });

    describe('onTypeSelect', () => {
        it('should emit typeSelected event when canAddVirtualPlayer is true', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_TRUE;
            spyOn(component.typeSelected, 'emit');
            fixture.detectChanges();

            component.onTypeSelect(VirtualPlayerType.Offensive);

            expect(component.typeSelected.emit).toHaveBeenCalledTimes(1);
            expect(component.typeSelected.emit).toHaveBeenCalledWith(VirtualPlayerType.Offensive);
        });

        it('should emit typeSelected event with Defensive type when canAddVirtualPlayer is true', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_TRUE;
            spyOn(component.typeSelected, 'emit');
            fixture.detectChanges();

            component.onTypeSelect(VirtualPlayerType.Defensive);

            expect(component.typeSelected.emit).toHaveBeenCalledTimes(1);
            expect(component.typeSelected.emit).toHaveBeenCalledWith(VirtualPlayerType.Defensive);
        });

        it('should not emit typeSelected event when canAddVirtualPlayer is false', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_FALSE;
            spyOn(component.typeSelected, 'emit');
            fixture.detectChanges();

            component.onTypeSelect(VirtualPlayerType.Offensive);

            expect(component.typeSelected.emit).not.toHaveBeenCalled();
        });

        it('should not emit typeSelected event when canAddVirtualPlayer is false and type is Defensive', () => {
            component.canAddVirtualPlayer = TEST_CAN_ADD_VIRTUAL_PLAYER_FALSE;
            spyOn(component.typeSelected, 'emit');
            fixture.detectChanges();

            component.onTypeSelect(VirtualPlayerType.Defensive);

            expect(component.typeSelected.emit).not.toHaveBeenCalled();
        });
    });

    describe('onCancel', () => {
        it('should emit cancelled event', () => {
            spyOn(component.cancelled, 'emit');
            fixture.detectChanges();

            component.onCancel();

            expect(component.cancelled.emit).toHaveBeenCalledTimes(1);
        });
    });
});

