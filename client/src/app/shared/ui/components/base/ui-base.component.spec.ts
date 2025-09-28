import { UiBaseComponent } from './ui-base.component';

class TestUiBaseComponent extends UiBaseComponent {}

describe('UiBaseComponent', () => {
    let comp: TestUiBaseComponent;

    beforeEach(() => {
        comp = new TestUiBaseComponent();
    });

    it('should initialize with default inputs', () => {
        expect(comp.variant).toBe('primary');
        expect(comp.size).toBe('md');
        expect(comp.shape).toBe('rounded');
        expect(comp.disabled).toBe(false);
        expect(comp.fullWidth).toBe(false);
        expect(comp.alignContent).toBe('center');
        expect(comp.gap).toBe('sm');
        expect(comp.loading).toBe(false);
        expect(comp.elevation).toBe('xs');
        expect(comp.popOut).toBe(true);
    });
});
