import { UiBase2Component } from './ui-base2.component';

class TestUiBase2Component extends UiBase2Component {}

describe('UiBase2Component', () => {
    let comp: TestUiBase2Component;

    beforeEach(() => {
        comp = new TestUiBase2Component();
    });

    it('styleVars returns custom width when widthValue provided and width is custom', () => {
        comp.width = 'custom';
        comp.widthValue = '300px';
        const vars = comp.styleVars;
        expect(vars['--ui-w']).toBe('300px');
    });

    it('styleVars is empty when width is custom but widthValue is empty string or null (falsy)', () => {
        comp.width = 'custom';
        comp.widthValue = '';
        expect(Object.keys(comp.styleVars).length).toBe(0);

        comp.widthValue = null as unknown as string;
        expect(Object.keys(comp.styleVars).length).toBe(0);
    });
});
