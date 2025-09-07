import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCheckboxComponent } from './checkbox.component';
import { By } from '@angular/platform-browser';

describe('CheckboxComponent', () => {
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

    it('should toggle value when clicked', () => {
        // Initial value should be false
        expect(component.value).toBeFalse();

        // Click the checkbox
        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        // Value should be toggled to true
        expect(component.value).toBeTrue();

        // Click again
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        // Value should toggle back to false
        expect(component.value).toBeFalse();
    });

    it('should not toggle when disabled', () => {
        // Set disabled to true
        component.disabled = true;
        fixture.detectChanges();

        // Initial value
        component.value = false;
        fixture.detectChanges();

        // Click the checkbox
        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        // Value should remain false
        expect(component.value).toBeFalse();
    });

    it('should call onChange and emit valueChange when toggled', () => {
        // Spy on onChange and valueChange
        spyOn(component, 'onChange');
        spyOn(component.valueChange, 'emit');

        // Click the checkbox
        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        // onChange and valueChange should be called with true
        expect(component.onChange).toHaveBeenCalledWith(true);
        expect(component.valueChange.emit).toHaveBeenCalledWith(true);
    });

    it('should display the provided label', () => {
        // Set label
        component.label = 'Test Label';
        fixture.detectChanges();

        // Check if label is displayed
        const labelElement = fixture.debugElement.query(By.css('.checkbox-label'));
        expect(labelElement.nativeElement.textContent).toBe('Test Label');
    });

    it('should apply the correct CSS classes based on inputs', () => {
        // Set inputs
        component.variant = 'success';
        component.size = 'lg';
        component.shape = 'pill';
        component.disabled = true;
        component.value = true;
        fixture.detectChanges();

        // Check classes
        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        const classes = checkboxElement.nativeElement.classList;

        expect(classes.contains('v-success')).toBeTrue();
        expect(classes.contains('s-lg')).toBeTrue();
        expect(classes.contains('sh-pill')).toBeTrue();
        expect(classes.contains('isDisabled')).toBeTrue();
        expect(classes.contains('isChecked')).toBeTrue();
    });
});
