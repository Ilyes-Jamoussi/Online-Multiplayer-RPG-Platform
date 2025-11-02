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
        const classes = comp.classes;
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
        comp.disabled = true;
        comp.fullWidth = true;
        comp.popOut = false;
        const classes = comp.classes;
        expect(classes['isDisabled']).toBeTrue();
        expect(classes['isFull']).toBeTrue();
        expect(classes['popOut']).toBeFalse();
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
        const classes = comp.classes;
        expect(classes['v-secondary']).toBeTrue();
        expect(classes['s-lg']).toBeTrue();
        expect(classes['sh-square']).toBeTrue();
        expect(classes['al-start']).toBeTrue();
        expect(classes['gap-lg']).toBeTrue();
        expect(classes['elev-md']).toBeTrue();
    });

    it('classes should fallback to defaults when string inputs are falsy', () => {
        comp.variant = '' as unknown as UiVariant;
        comp.size = '' as unknown as UiSize;
        comp.shape = '' as unknown as UiShapeVariant;
        comp.alignContent = '' as unknown as UiAlignment;
        comp.gap = '' as unknown as UiSpacing;
        comp.elevation = '' as unknown as UiElevation;
        const classes = comp.classes;
        expect(classes['c-primary']).toBeTrue();
        expect(classes['st-filled']).toBeTrue();
        expect(classes['s-md']).toBeTrue();
        expect(classes['sh-rounded']).toBeTrue();
        expect(classes['al-center']).toBeTrue();
        expect(classes['gap-md']).toBeTrue();
        expect(classes['elev-none']).toBeTrue();
    });
});
