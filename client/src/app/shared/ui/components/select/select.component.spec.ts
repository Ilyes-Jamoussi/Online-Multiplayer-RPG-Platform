import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { UiSelectComponent } from './select.component';

describe('UiSelectComponent', () => {
    let component: UiSelectComponent;
    let fixture: ComponentFixture<UiSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, UiIconComponent, UiSelectComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiSelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display the label when provided', () => {
        component.label = 'Test Label';
        fixture.detectChanges();

        const labelElement = fixture.debugElement.query(By.css('.uiSelect-label'));
        expect(labelElement.nativeElement.textContent).toContain('Test Label');
    });

    it('should not display the label when not provided', () => {
        component.label = '';
        fixture.detectChanges();

        const labelElement = fixture.debugElement.query(By.css('.uiSelect-label'));
        expect(labelElement).toBeNull();
    });

    it('should display the prefix icon when provided', () => {
        component.prefixIcon = 'Coffee';
        fixture.detectChanges();

        const prefixIcon = fixture.debugElement.query(By.css('.prefix-icon'));
        expect(prefixIcon).toBeTruthy();
    });

    it('should have a select element', () => {
        const selectElement = fixture.debugElement.query(By.css('select'));
        expect(selectElement).toBeTruthy();
    });

    it('should update value on change event', () => {
        const selectElement = fixture.debugElement.query(By.css('select'));
        spyOn(component, 'onSelectChange');

        selectElement.triggerEventHandler('change', { target: { value: 'new-value' } });
        fixture.detectChanges();

        expect(component.onSelectChange).toHaveBeenCalled();
    });

    it('should show placeholder as disabled option when no value is selected', () => {
        component.placeholder = 'Select an option';
        fixture.detectChanges();

        const placeholderOption = fixture.debugElement.query(By.css('option[disabled]'));
        expect(placeholderOption.nativeElement.textContent).toContain('Select an option');
    });

    it('should update value when writing value', () => {
        component.writeValue('test-value');
        expect(component.value).toBe('test-value');
    });

    it('should register onChange function', () => {
        const mockFn = jasmine.createSpy('onChange');
        component.registerOnChange(mockFn);

        // Mock a change event
        const event = { target: { value: 'new-value' } } as unknown as Event;
        component.onSelectChange(event);

        expect(mockFn).toHaveBeenCalledWith('new-value');
    });

    it('should register onTouched function', () => {
        const mockFn = jasmine.createSpy('onTouched');
        component.registerOnTouched(mockFn);

        component.onBlur();

        expect(mockFn).toHaveBeenCalled();
    });

    it('should set disabled state correctly', () => {
        component.setDisabledState(true);
        expect(component.isDisabled).toBeTrue();

        component.setDisabledState(false);
        expect(component.isDisabled).toBeFalse();
    });
});
