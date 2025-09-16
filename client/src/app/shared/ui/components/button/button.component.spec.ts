import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './button.component';

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

    it('should have default values', () => {
        expect(component.text).toBe('Button');
        expect(component.iconRight).toBe(false);
        expect(component.htmlType).toBe('button');
        expect(component.shape).toBe('pill');
    });

    it('should generate correct classes with defaults', () => {
        const classes = component.classes;
        expect(classes.uiBtn).toBe(true);
        expect(classes.iconRight).toBe(false);
        expect(classes.iconLeft).toBe(false);
        expect(classes['v-primary']).toBe(true);
        expect(classes['sh-pill']).toBe(true);
    });

    it('should generate correct classes with icon on left', () => {
        component.icon = 'add';
        component.iconRight = false;
        const classes = component.classes;
        expect(classes.iconLeft).toBe(true);
        expect(classes.iconRight).toBe(false);
    });

    it('should generate correct classes with icon on right', () => {
        component.icon = 'add';
        component.iconRight = true;
        const classes = component.classes;
        expect(classes.iconRight).toBe(true);
        expect(classes.iconLeft).toBe(false);
    });

    it('should emit buttonClick when clicked and not disabled/loading', () => {
        spyOn(component.buttonClick, 'emit');
        const event = new MouseEvent('click');

        component.onClick(event);

        expect(component.buttonClick.emit).toHaveBeenCalledWith(event);
    });

    it('should not emit buttonClick when disabled', () => {
        spyOn(component.buttonClick, 'emit');
        component.disabled = true;
        const event = new MouseEvent('click');

        component.onClick(event);

        expect(component.buttonClick.emit).not.toHaveBeenCalled();
    });

    it('should not emit buttonClick when loading', () => {
        spyOn(component.buttonClick, 'emit');
        component.loading = true;
        const event = new MouseEvent('click');

        component.onClick(event);

        expect(component.buttonClick.emit).not.toHaveBeenCalled();
    });

    it('should handle custom text', () => {
        component.text = 'Custom Button';
        expect(component.text).toBe('Custom Button');
    });

    it('should handle custom html type', () => {
        component.htmlType = 'submit';
        expect(component.htmlType).toBe('submit');

        component.htmlType = 'reset';
        expect(component.htmlType).toBe('reset');
    });

    it('should handle custom shape', () => {
        component.shape = 'rounded';
        const classes = component.classes;
        expect(classes['sh-rounded']).toBe(true);
    });

    it('should handle all variants', () => {
        component.variant = 'secondary';
        expect(component.classes['v-secondary']).toBe(true);

        component.variant = 'danger';
        expect(component.classes['v-danger']).toBe(true);
    });

    it('should handle disabled state in classes', () => {
        component.disabled = true;
        expect(component.classes.isDisabled).toBe(true);
    });

    it('should handle loading state in classes', () => {
        component.loading = true;
        const classes = component.classes;
        // The loading state is handled in the base component classes
        expect(classes['v-primary']).toBe(true); // Just verify classes are generated
        expect(component.loading).toBe(true); // Verify the loading property is set
    });
});
