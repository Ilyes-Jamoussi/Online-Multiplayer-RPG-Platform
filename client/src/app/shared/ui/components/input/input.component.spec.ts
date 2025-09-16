import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiInputComponent } from './input.component';

describe('UiInputComponent', () => {
    let component: UiInputComponent;
    let fixture: ComponentFixture<UiInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.alignText).toBe('left');
        expect(component.clearable).toBe(false);
        expect(component.label).toBe('');
        expect(component.placeholder).toBe('');
        expect(component.required).toBe(false);
        expect(component.type).toBe('text');
        expect(component.value).toBe('');
        expect(component.isDisabled).toBe(false);
    });

    it('should generate correct classes with defaults', () => {
        const classes = component.classes;
        expect(classes.uiInput).toBe(true);
        expect(classes['al-left']).toBe(true);
        expect(classes.isDisabled).toBe(false);
        expect(classes.isLoading).toBe(false);
        expect(classes.hasPrefixIcon).toBe(false);
        expect(classes.hasSuffixIcon).toBe(false);
        expect(classes.isClearable).toBe(false);
        expect(classes.hasLabel).toBe(false);
        expect(classes.disableHoverEffects).toBe(true);
    });

    it('should generate correct classes with custom values', () => {
        component.alignText = 'center';
        component.clearable = true;
        component.label = 'Test Label';
        component.prefixIcon = 'Plus';
        component.suffixIcon = 'Trash';
        component.disabled = true;
        component.loading = true;

        const classes = component.classes;
        expect(classes['al-center']).toBe(true);
        expect(classes.isClearable).toBe(true);
        expect(classes.hasLabel).toBe(true);
        expect(classes.hasPrefixIcon).toBe(true);
        expect(classes.hasSuffixIcon).toBe(true);
        expect(classes.isDisabled).toBe(true);
        expect(classes.isLoading).toBe(true);
    });

    describe('ControlValueAccessor', () => {
        it('should write value', () => {
            component.writeValue('test value');
            expect(component.value).toBe('test value');
        });

        it('should register onChange callback', () => {
            const callback = jasmine.createSpy('onChange');
            component.registerOnChange(callback);

            const event = { target: { value: 'new value' } } as Event & { target: HTMLInputElement };
            component.onInput(event);

            expect(callback).toHaveBeenCalledWith('new value');
            expect(component.value).toBe('new value');
        });

        it('should register onTouched callback', () => {
            const callback = jasmine.createSpy('onTouched');
            component.registerOnTouched(callback);

            component.onBlur();

            expect(callback).toHaveBeenCalled();
        });

        it('should set disabled state', () => {
            component.setDisabledState(true);
            expect(component.isDisabled).toBe(true);

            component.setDisabledState(false);
            expect(component.isDisabled).toBe(false);
        });
    });

    it('should clear value when onClear is called', () => {
        const callback = jasmine.createSpy('onChange');
        component.registerOnChange(callback);
        component.value = 'test value';

        component.onClear();

        expect(component.value).toBe('');
        expect(callback).toHaveBeenCalledWith('');
    });

    it('should handle input event', () => {
        const callback = jasmine.createSpy('onChange');
        component.registerOnChange(callback);

        const event = { target: { value: 'input value' } } as Event & { target: HTMLInputElement };
        component.onInput(event);

        expect(component.value).toBe('input value');
        expect(callback).toHaveBeenCalledWith('input value');
    });

    it('should handle blur event', () => {
        const callback = jasmine.createSpy('onTouched');
        component.registerOnTouched(callback);

        component.onBlur();

        expect(callback).toHaveBeenCalled();
    });

    it('should handle disabled state in classes', () => {
        component.isDisabled = true;
        expect(component.classes.isDisabled).toBe(true);

        component.isDisabled = false;
        component.disabled = true;
        expect(component.classes.isDisabled).toBe(true);
    });
});
