import { UiAlignment, UiElevation, UiShapeVariant, UiSize, UiSpacing, UiVariant } from '@app/types/ui.types';
import { UiBaseComponent } from './ui-base.component';

class TestUiBaseComponent extends UiBaseComponent {}

describe('UiBaseComponent', () => {
    let component: TestUiBaseComponent;

    beforeEach(() => {
        component = new TestUiBaseComponent();
    });

    it('should initialize with default inputs', () => {
        expect(component.variant).toBeUndefined();
        expect(component.size).toBe('md');
        expect(component.shape).toBeUndefined();
        expect(component.disabled).toBe(false);
        expect(component.fullWidth).toBeUndefined();
        expect(component.alignContent).toBe('center');
        expect(component.gap).toBe('md');
        expect(component.loading).toBe(false);
        expect(component.elevation).toBe('none');
        expect(component.popOut).toBe(true);
    });

    it('classes should reflect defaults', () => {
        const classes = component.classes;
        expect(classes['c-primary']).toBeTrue();
        expect(classes['st-filled']).toBeTrue();
        expect(classes['s-md']).toBeTrue();
        expect(classes['sh-rounded']).toBeTrue();
        expect(classes['isDisabled']).toBeFalse();
        expect(classes['isFull']).toBeFalsy();
        expect(classes['al-center']).toBeTrue();
        expect(classes['gap-md']).toBeTrue();
        expect(classes['elev-none']).toBeTrue();
        expect(classes['popOut']).toBeTrue();
        expect(classes['disableHoverEffects']).toBeFalse();
    });

    it('classes should reflect boolean flags', () => {
        component.disabled = true;
        component.fullWidth = true;
        component.popOut = false;
        const classes = component.classes;
        expect(classes['isDisabled']).toBeTrue();
        expect(classes['isFull']).toBeTrue();
        expect(classes['popOut']).toBeFalse();
    });

    it('should return color when color input is set', () => {
        component.color = 'danger';
        expect(component.computedColor).toBe('danger');
    });

    it('should return computed color based on variant when color is not set', () => {
        component.variant = 'danger';
        expect(component.computedColor).toBe('danger');
    });

    it('classes should use provided non-default values', () => {
        component.variant = 'secondary' as UiVariant;
        component.size = 'lg' as UiSize;
        component.shape = 'square' as UiShapeVariant;
        component.alignContent = 'start' as UiAlignment;
        component.gap = 'lg' as UiSpacing;
        component.elevation = 'md' as UiElevation;
        const classes = component.classes;
        expect(classes['v-secondary']).toBeTrue();
        expect(classes['s-lg']).toBeTrue();
        expect(classes['sh-square']).toBeTrue();
        expect(classes['al-start']).toBeTrue();
        expect(classes['gap-lg']).toBeTrue();
        expect(classes['elev-md']).toBeTrue();
    });

    it('classes should fallback to defaults when string inputs are falsy', () => {
        component.variant = '' as unknown as UiVariant;
        component.size = '' as unknown as UiSize;
        component.shape = '' as unknown as UiShapeVariant;
        component.alignContent = '' as unknown as UiAlignment;
        component.gap = '' as unknown as UiSpacing;
        component.elevation = '' as unknown as UiElevation;
        const classes = component.classes;
        expect(classes['c-primary']).toBeTrue();
        expect(classes['st-filled']).toBeTrue();
        expect(classes['s-md']).toBeTrue();
        expect(classes['sh-rounded']).toBeTrue();
        expect(classes['al-center']).toBeTrue();
        expect(classes['gap-md']).toBeTrue();
        expect(classes['elev-none']).toBeTrue();
    });
});
