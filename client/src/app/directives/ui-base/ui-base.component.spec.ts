import { UiBaseComponent } from './ui-base.component';
import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing, UiElevation } from '@app/types/ui.types';

class TestUiBaseComponent extends UiBaseComponent {}

describe('UiBaseComponent', () => {
    let comp: TestUiBaseComponent;

    beforeEach(() => {
        comp = new TestUiBaseComponent();
    });

    it('should initialize with default inputs', () => {
        expect(comp.variant).toBeUndefined();
        expect(comp.size).toBe('md');
        expect(comp.shape).toBeUndefined();
        expect(comp.disabled).toBe(false);
        expect(comp.fullWidth).toBeUndefined();
        expect(comp.alignContent).toBe('center');
        expect(comp.gap).toBe('md');
        expect(comp.loading).toBe(false);
        expect(comp.elevation).toBe('none');
        expect(comp.popOut).toBe(true);
    });

    it('classes should reflect defaults', () => {
        const c = comp.classes;
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
        comp.disabled = true;
        comp.fullWidth = true;
        comp.popOut = false;
        const c = comp.classes;
        expect(c['isDisabled']).toBeTrue();
        expect(c['isFull']).toBeTrue();
        expect(c['popOut']).toBeFalse();
    });

    it('should return color when color input is set', () => {
        comp.color = 'danger';
        expect(comp.computedColor).toBe('danger');
    });

    it('should return computed color based on variant when color is not set', () => {
        comp.variant = 'danger';
        expect(comp.computedColor).toBe('danger');
    });

    it('classes should use provided non-default values', () => {
        comp.variant = 'secondary' as UiVariant;
        comp.size = 'lg' as UiSize;
        comp.shape = 'square' as UiShapeVariant;
        comp.alignContent = 'start' as UiAlignment;
        comp.gap = 'lg' as UiSpacing;
        comp.elevation = 'md' as UiElevation;
        const c = comp.classes;
        expect(c['v-secondary']).toBeTrue();
        expect(c['s-lg']).toBeTrue();
        expect(c['sh-square']).toBeTrue();
        expect(c['al-start']).toBeTrue();
        expect(c['gap-lg']).toBeTrue();
        expect(c['elev-md']).toBeTrue();
    });

    it('classes should fallback to defaults when string inputs are falsy', () => {
        comp.variant = '' as unknown as UiVariant;
        comp.size = '' as unknown as UiSize;
        comp.shape = '' as unknown as UiShapeVariant;
        comp.alignContent = '' as unknown as UiAlignment;
        comp.gap = '' as unknown as UiSpacing;
        comp.elevation = '' as unknown as UiElevation;
        const c = comp.classes;
        expect(c['c-primary']).toBeTrue();
        expect(c['st-filled']).toBeTrue();
        expect(c['s-md']).toBeTrue();
        expect(c['sh-rounded']).toBeTrue();
        expect(c['al-center']).toBeTrue();
        expect(c['gap-md']).toBeTrue();
        expect(c['elev-none']).toBeTrue();
    });
});
