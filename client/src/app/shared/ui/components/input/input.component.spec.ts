import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { UiInputComponent } from './input.component';
import { UiIconComponent } from '@app/shared/ui/components/icon/icon.component';
import { FaIconKey } from '@ui/types/ui.types';

describe('UiInputComponent', () => {
    let fixture: ComponentFixture<UiInputComponent>;
    let component: UiInputComponent;

    const queryInput = () => fixture.debugElement.query(By.css('input.in-control')).nativeElement as HTMLInputElement;

    const queryWrapper = () => fixture.debugElement.query(By.css('.uiInput')).nativeElement as HTMLElement;

    const queryLabel = () => fixture.debugElement.query(By.css('.uiInput-label'));
    const queryReqStar = () => fixture.debugElement.query(By.css('.uiInput-label .req'));
    const queryCounter = () => fixture.debugElement.query(By.css('.uiInput-meta .counter'));
    const queryClearBtn = () => fixture.debugElement.query(By.css('button.clear-btn'))?.nativeElement as HTMLButtonElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, UiInputComponent, UiIconComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders label and required star when provided', () => {
        component.label = 'My label';
        component.required = true;
        fixture.detectChanges();

        const labelEl = queryLabel();
        expect(labelEl).toBeTruthy();
        expect(labelEl.nativeElement.textContent).toContain('My label');

        const star = queryReqStar();
        expect(star).toBeTruthy();
        expect(star.nativeElement.textContent.trim()).toBe('*');
    });

    it('does not render label when empty', () => {
        component.label = '';
        component.required = false;
        fixture.detectChanges();

        expect(queryLabel()).toBeNull();
    });

    it('writeValue() sets value and binds it to the input', () => {
        component.writeValue('abc');
        fixture.detectChanges();

        expect(component.value).toBe('abc');
        expect(queryInput().value).toBe('abc');
    });

    it('registerOnChange + onInput propagate value', () => {
        const spy = jasmine.createSpy('onChange');
        component.registerOnChange(spy);

        const input = queryInput();
        input.value = 'hello';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.value).toBe('hello');
        expect(spy).toHaveBeenCalledWith('hello');
    });

    it('registerOnTouched + onBlur propagate touch', () => {
        const touched = jasmine.createSpy('onTouched');
        component.registerOnTouched(touched);

        queryInput().dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(touched).toHaveBeenCalled();
    });

    it('clear button visible when clearable + value, and clears with onChange call', () => {
        const spy = jasmine.createSpy('onChange');
        component.registerOnChange(spy);

        component.clearable = true;
        component.writeValue('x');
        fixture.detectChanges();

        const btn = queryClearBtn();
        expect(btn).toBeTruthy();
        expect(btn.classList.contains('isHidden')).toBeFalse();

        btn.click();
        fixture.detectChanges();

        expect(component.value).toBe('');
        expect(spy).toHaveBeenCalledWith('');
    });

    it('clear button hidden when not clearable', () => {
        component.clearable = false;
        component.writeValue('x');
        fixture.detectChanges();

        const btn = queryClearBtn();
        expect(btn).toBeTruthy();
        expect(btn.classList.contains('isHidden')).toBeTrue();
    });

    it('clear button hidden when empty value', () => {
        component.clearable = true;
        component.writeValue('');
        fixture.detectChanges();

        const btn = queryClearBtn();
        expect(btn).toBeTruthy();
        expect(btn.classList.contains('isHidden')).toBeTrue();
    });

    it('clear button hidden when disabled (from base disabled)', () => {
        component.clearable = true;
        component.writeValue('x');
        component.disabled = true;
        fixture.detectChanges();

        const btn = queryClearBtn();
        expect(btn).toBeTruthy();
        expect(btn.classList.contains('isHidden')).toBeTrue();

        component.disabled = false;
        fixture.detectChanges();
    });

    it('clear button hidden when isDisabled via setDisabledState()', () => {
        component.clearable = true;
        component.writeValue('x');
        component.setDisabledState(true);
        fixture.detectChanges();

        const btn = queryClearBtn();
        expect(btn).toBeTruthy();
        expect(btn.classList.contains('isHidden')).toBeTrue();

        component.setDisabledState(false);
        fixture.detectChanges();
    });

    it('disabled attribute reflects disabled || isDisabled', () => {
        component.disabled = true;
        fixture.detectChanges();
        expect(queryInput().disabled).toBeTrue();

        component.disabled = false;
        component.setDisabledState(true);
        fixture.detectChanges();
        expect(queryInput().disabled).toBeTrue();

        component.setDisabledState(false);
        fixture.detectChanges();
        expect(queryInput().disabled).toBeFalse();
    });

    it('classes getter adds proper flags (align, icons, clearable, label, loading, disabled)', () => {
        component.alignText = 'center';
        component.prefixIcon = 'any-icon' as unknown as FaIconKey;
        component.suffixIcon = 'any-icon-2' as unknown as FaIconKey;
        component.clearable = true;
        component.label = 'LBL';
        component.loading = true;
        component.setDisabledState(false);
        component.disabled = false;

        fixture.detectChanges();
        const wrapper = queryWrapper();
        const cl = wrapper.classList;

        expect(cl.contains('uiInput')).toBeTrue();
        expect(cl.contains('al-center')).toBeTrue();
        expect(cl.contains('hasPrefixIcon')).toBeTrue();
        expect(cl.contains('hasSuffixIcon')).toBeTrue();
        expect(cl.contains('isClearable')).toBeTrue();
        expect(cl.contains('hasLabel')).toBeTrue();
        expect(cl.contains('isLoading')).toBeTrue();
        expect(cl.contains('isDisabled')).toBeFalse();
        expect(cl.contains('disableHoverEffects')).toBeTrue();

        component.disabled = true;
        fixture.detectChanges();
        expect(queryWrapper().classList.contains('isDisabled')).toBeTrue();

        component.disabled = false;
        component.setDisabledState(true);
        fixture.detectChanges();
        expect(queryWrapper().classList.contains('isDisabled')).toBeTrue();

        component.setDisabledState(false);
        fixture.detectChanges();
    });

    it('renders prefix & suffix icons when provided (and variant=secondary)', () => {
        component.prefixIcon = 'icon-a' as unknown as FaIconKey;
        component.suffixIcon = 'icon-b' as unknown as FaIconKey;
        fixture.detectChanges();

        const icons = fixture.debugElement.queryAll(By.directive(UiIconComponent));
        expect(icons.length).toBe(2);
        const [pre, suf] = icons.map((d) => d.componentInstance as UiIconComponent);

        expect(pre.iconName).toBe(component.prefixIcon);
        expect(suf.iconName).toBe(component.suffixIcon);
        expect(pre.variant).toBe('secondary');
        expect(suf.variant).toBe('secondary');
    });

    it('shows maxlength counter when maxLength is set; hides when not set', () => {
        component.maxLength = 10;
        component.writeValue('abcd');
        fixture.detectChanges();

        const cnt = queryCounter();
        expect(cnt).toBeTruthy();
        expect(cnt.nativeElement.textContent.trim()).toBe('4/10');

        component.maxLength = undefined;
        fixture.detectChanges();
        expect(queryCounter()).toBeNull();
    });

    it('binds maxlength/minlength attributes when defined; removes when undefined', () => {
        component.maxLength = 12;
        component.minLength = 2;
        fixture.detectChanges();

        let input = queryInput();
        expect(input.hasAttribute('maxlength')).toBeTrue();
        expect(input.getAttribute('maxlength')).toBe('12');
        expect(input.hasAttribute('minlength')).toBeTrue();
        expect(input.getAttribute('minlength')).toBe('2');

        component.maxLength = undefined;
        component.minLength = undefined;
        fixture.detectChanges();

        input = queryInput();
        expect(input.hasAttribute('maxlength')).toBeFalse();
        expect(input.hasAttribute('minlength')).toBeFalse();
    });

    it('binds placeholder, type and text-align style', () => {
        component.placeholder = 'Type here';
        component.type = 'email';
        component.alignText = 'right';
        fixture.detectChanges();

        const input = queryInput();
        expect(input.getAttribute('placeholder')).toBe('Type here');
        expect(input.getAttribute('type')).toBe('email');
        expect(input.style.textAlign).toBe('right');

        component.alignText = undefined;
        fixture.detectChanges();
        expect(queryInput().style.textAlign).toBe('left');

        expect(queryWrapper().classList.contains('al-left')).toBeTrue();
    });

    it('provides itself as NG_VALUE_ACCESSOR and behaves like a ControlValueAccessor', () => {
        // Retrieve the value accessors attached to the component's element
        const accessors = fixture.debugElement.injector.get(NG_VALUE_ACCESSOR);

        //  accessors is a multi-provider -> non-empty array
        expect(Array.isArray(accessors)).toBeTrue();
        expect(accessors.length).toBe(1); // should have 1 accessor (input component)

        const accessor = accessors[0];

        //  the accessor should point to the component instance
        expect(accessor).toBe(component);
        expect(accessor instanceof UiInputComponent).toBeTrue();
    });
});
