import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('UiButtonComponent', () => {
    let component: UiButtonComponent;
    let fixture: ComponentFixture<UiButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have correct default @Input values', () => {
        expect(component.variant).toBe('primary');
        expect(component.size).toBe('md');
        expect(component.disabled).toBe(false);
        expect(component.loading).toBe(false);
        expect(component.fullWidth).toBe(false);
        expect(component.type).toBe('button');
    });

    it('should expose type as a configurable @Input', () => {
        component.type = 'submit';
        expect(component.type).toBe('submit');
        component.type = 'reset';
        expect(component.type).toBe('reset');
    });

    it('should emit buttonClick when enabled and not loading', () => {
        const spy = spyOn(component.buttonClick, 'emit');
        component.disabled = false;
        component.loading = false;

        const evt = new MouseEvent('click');
        component.onClick(evt);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(evt);
    });

    it('should NOT emit when disabled', () => {
        const spy = spyOn(component.buttonClick, 'emit');
        component.disabled = true;
        component.loading = false;

        component.onClick(new MouseEvent('click'));
        expect(spy).not.toHaveBeenCalled();
    });

    it('should NOT emit when loading', () => {
        const spy = spyOn(component.buttonClick, 'emit');
        component.disabled = false;
        component.loading = true;

        component.onClick(new MouseEvent('click'));
        expect(spy).not.toHaveBeenCalled();
    });

    it('should NOT emit when both disabled and loading', () => {
        const spy = spyOn(component.buttonClick, 'emit');
        component.disabled = true;
        component.loading = true;

        component.onClick(new MouseEvent('click'));
        expect(spy).not.toHaveBeenCalled();
    });

    it('classes getter should include base class and reflect flags', () => {
        let cls = component.classes.split(' ').filter(Boolean);
        expect(cls).toContain('ui-button');
        expect(cls).toContain('ui-button--primary');
        expect(cls).toContain('ui-button--md');
        expect(cls).not.toContain('ui-button--disabled');
        expect(cls).not.toContain('ui-button--loading');
        expect(cls).not.toContain('ui-button--full-width');

        component.disabled = true;
        component.loading = true;
        component.fullWidth = true;
        cls = component.classes.split(' ').filter(Boolean);

        expect(cls).toContain('ui-button--disabled');
        expect(cls).toContain('ui-button--loading');
        expect(cls).toContain('ui-button--full-width');
    });

    it('classes getter should reflect variant changes', () => {
        const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'ghost'];
        for (const v of variants) {
            component.variant = v;
            const cls = component.classes.split(' ').filter(Boolean);
            expect(cls).toContain(`ui-button--${v}`);
        }
    });

    it('classes getter should reflect size changes', () => {
        const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
        for (const s of sizes) {
            component.size = s;
            const cls = component.classes.split(' ').filter(Boolean);
            expect(cls).toContain(`ui-button--${s}`);
        }
    });

    it('classes getter should not contain empty tokens when flags are false', () => {
        component.disabled = false;
        component.loading = false;
        component.fullWidth = false;

        const raw = component.classes;
        expect(raw).not.toContain('  ');
        const expected = ['ui-button', `ui-button--${component.variant}`, `ui-button--${component.size}`];
        expect(raw.split(' ').filter(Boolean).sort()).toEqual(expected.sort());
    });
});
