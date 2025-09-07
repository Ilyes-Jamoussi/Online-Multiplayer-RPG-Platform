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
        expect(component.value).toBeFalse();

        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        expect(component.value).toBeTrue();

        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        expect(component.value).toBeFalse();
    });

    it('should not toggle when disabled', () => {
        component.disabled = true;
        fixture.detectChanges();

        component.value = false;
        fixture.detectChanges();

        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        expect(component.value).toBeFalse();
    });

    it('should emit valueChange when toggled', () => {
        spyOn(component.valueChange, 'emit');

        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        checkboxElement.triggerEventHandler('click', new MouseEvent('click'));
        fixture.detectChanges();

        expect(component.valueChange.emit).toHaveBeenCalledWith(true);
    });

    it('should display the provided label', () => {
        component.label = 'Test Label';
        fixture.detectChanges();

        const labelElement = fixture.debugElement.query(By.css('.checkbox-label'));
        expect(labelElement.nativeElement.textContent).toBe('Test Label');
    });

    it('should apply the correct CSS classes based on inputs', () => {
        component.variant = 'success';
        component.size = 'lg';
        component.shape = 'pill';
        component.disabled = true;
        component.value = true;
        fixture.detectChanges();

        const checkboxElement = fixture.debugElement.query(By.css('.uiCheckbox'));
        const classes = checkboxElement.nativeElement.classList;

        expect(classes.contains('v-success')).toBeTrue();
        expect(classes.contains('s-lg')).toBeTrue();
        expect(classes.contains('sh-pill')).toBeTrue();
        expect(classes.contains('isDisabled')).toBeTrue();
        expect(classes.contains('isChecked')).toBeTrue();
    });
});
