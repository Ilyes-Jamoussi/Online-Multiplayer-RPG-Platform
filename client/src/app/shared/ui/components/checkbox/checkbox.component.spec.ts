import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCheckboxComponent } from './checkbox.component';

describe('UiCheckboxComponent', () => {
    let component: UiCheckboxComponent;
    let fixture: ComponentFixture<UiCheckboxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiCheckboxComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiCheckboxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.label).toBe('');
        expect(component.value).toBe(false);
    });

    it('should generate correct classes with defaults', () => {
        const classes = component.classes;
        expect(classes.uiCheckbox).toBe(true);
        expect(classes.isChecked).toBe(false);
        expect(classes['v-primary']).toBe(true);
        expect(classes['s-md']).toBe(true);
    });

    it('should generate correct classes when checked', () => {
        component.value = true;
        const classes = component.classes;
        expect(classes.isChecked).toBe(true);
    });

    describe('ControlValueAccessor', () => {
        it('should write value', () => {
            component.writeValue(true);
            expect(component.value).toBe(true);

            component.writeValue(false);
            expect(component.value).toBe(false);
        });

        it('should register onChange callback', () => {
            const callback = jasmine.createSpy('onChange');
            component.registerOnChange(callback);

            const event = new MouseEvent('click');
            component.toggleValue(event);

            expect(callback).toHaveBeenCalledWith(true);
        });

        it('should register onTouched callback', () => {
            const callback = jasmine.createSpy('onTouched');
            component.registerOnTouched(callback);

            const event = new MouseEvent('click');
            component.toggleValue(event);

            expect(callback).toHaveBeenCalled();
        });

        it('should set disabled state', () => {
            component.setDisabledState(true);
            expect(component.disabled).toBe(true);

            component.setDisabledState(false);
            expect(component.disabled).toBe(false);
        });
    });

    describe('toggleValue', () => {
        it('should toggle value from false to true', () => {
            spyOn(component.valueChange, 'emit');
            const callback = jasmine.createSpy('onChange');
            component.registerOnChange(callback);

            const event = new MouseEvent('click');
            spyOn(event, 'preventDefault');

            component.value = false;
            component.toggleValue(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.value).toBe(true);
            expect(component.valueChange.emit).toHaveBeenCalledWith(true);
            expect(callback).toHaveBeenCalledWith(true);
        });

        it('should toggle value from true to false', () => {
            spyOn(component.valueChange, 'emit');
            const callback = jasmine.createSpy('onChange');
            component.registerOnChange(callback);

            const event = new MouseEvent('click');
            component.value = true;
            component.toggleValue(event);

            expect(component.value).toBe(false);
            expect(component.valueChange.emit).toHaveBeenCalledWith(false);
            expect(callback).toHaveBeenCalledWith(false);
        });

        it('should not toggle when disabled', () => {
            spyOn(component.valueChange, 'emit');
            const callback = jasmine.createSpy('onChange');
            component.registerOnChange(callback);

            component.disabled = true;
            component.value = false;

            const event = new MouseEvent('click');
            component.toggleValue(event);

            expect(component.value).toBe(false);
            expect(component.valueChange.emit).not.toHaveBeenCalled();
            expect(callback).not.toHaveBeenCalled();
        });

        it('should call onTouch callback', () => {
            const callback = jasmine.createSpy('onTouch');
            component.registerOnTouched(callback);

            const event = new MouseEvent('click');
            component.toggleValue(event);

            expect(callback).toHaveBeenCalled();
        });
    });
});
