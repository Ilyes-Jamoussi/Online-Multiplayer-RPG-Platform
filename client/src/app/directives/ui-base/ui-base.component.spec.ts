import { UiBaseComponent } from './ui-base.component';
import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing, UiElevation } from '@app/types/ui.types';

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
        const c = component.classes;
        expect(c['c-primary']).toBeTrue();
        expect(c['st-filled']).toBeTrue();
        expect(c['s-md']).toBeTrue();
        expect(c['sh-rounded']).toBeTrue();
        expect(c['isDisabled']).toBeFalse();
        expect(c['isFull']).toBeFalsy();
        expect(c['al-center']).toBeTrue();
        expect(c['gap-md']).toBeTrue();
        expect(c['elev-none']).toBeTrue();
        expect(c['popOut']).toBeTrue();
        expect(c['disableHoverEffects']).toBeFalse();
    });

    it('classes should reflect boolean flags', () => {
        component.disabled = true;
        component.fullWidth = true;
        component.popOut = false;
        const c = component.classes;
        expect(c['isDisabled']).toBeTrue();
        expect(c['isFull']).toBeTrue();
        expect(c['popOut']).toBeFalse();
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
        const c = component.classes;
        expect(c['v-secondary']).toBeTrue();
        expect(c['s-lg']).toBeTrue();
        expect(c['sh-square']).toBeTrue();
        expect(c['al-start']).toBeTrue();
        expect(c['gap-lg']).toBeTrue();
        expect(c['elev-md']).toBeTrue();
    });

    it('classes should fallback to defaults when string inputs are falsy', () => {
        component.variant = '' as unknown as UiVariant;
        component.size = '' as unknown as UiSize;
        component.shape = '' as unknown as UiShapeVariant;
        component.alignContent = '' as unknown as UiAlignment;
        component.gap = '' as unknown as UiSpacing;
        component.elevation = '' as unknown as UiElevation;
        const c = component.classes;
        expect(c['c-primary']).toBeTrue();
        expect(c['st-filled']).toBeTrue();
        expect(c['s-md']).toBeTrue();
        expect(c['sh-rounded']).toBeTrue();
        expect(c['al-center']).toBeTrue();
        expect(c['gap-md']).toBeTrue();
        expect(c['elev-none']).toBeTrue();
    });
});
