import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCardComponent, UI_CARD_CONTEXT } from './card.component';

describe('UiCardComponent', () => {
    let component: UiCardComponent;
    let fixture: ComponentFixture<UiCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values from base component', () => {
        expect(component.variant).toBe('primary');
        expect(component.size).toBe('md');
        expect(component.shape).toBe('rounded');
        expect(component.disabled).toBe(false);
        expect(component.fullWidth).toBe(false);
        expect(component.alignContent).toBe('center');
        expect(component.gap).toBe('sm');
        expect(component.loading).toBe(false);
        expect(component.elevation).toBe('xs');
        expect(component.popOut).toBe(true);
    });

    it('should generate correct classes with defaults', () => {
        const classes = component.classes;
        expect(classes['uiCard']).toBe(true);
        expect(classes['v-primary']).toBe(true);
        expect(classes['s-md']).toBe(true);
        expect(classes['sh-rounded']).toBe(true);
        expect(classes['isDisabled']).toBe(false);
        expect(classes['isFull']).toBe(false);
        expect(classes['al-center']).toBe(true);
        expect(classes['gap-sm']).toBe(true);
        expect(classes['elev-xs']).toBe(true);
        expect(classes['popOut']).toBe(true);
        expect(classes['disableHoverEffects']).toBe(false);
    });

    it('should generate correct classes with custom values', () => {
        component.variant = 'secondary';
        component.size = 'lg';
        component.shape = 'square';
        component.disabled = true;
        component.fullWidth = true;
        component.alignContent = 'left';
        component.gap = 'md';
        component.elevation = 'md';
        component.popOut = false;

        const classes = component.classes;
        expect(classes['uiCard']).toBe(true);
        expect(classes['v-secondary']).toBe(true);
        expect(classes['s-lg']).toBe(true);
        expect(classes['sh-square']).toBe(true);
        expect(classes['isDisabled']).toBe(true);
        expect(classes['isFull']).toBe(true);
        expect(classes['al-left']).toBe(true);
        expect(classes['gap-md']).toBe(true);
        expect(classes['elev-md']).toBe(true);
        expect(classes['popOut']).toBe(false);
        expect(classes['disableHoverEffects']).toBe(false);
    });

    it('should provide UI_CARD_CONTEXT', () => {
        const context = fixture.debugElement.injector.get(UI_CARD_CONTEXT);
        expect(context).toBeDefined();
        expect(context.variant).toBe('primary');
        expect(context.size).toBe('md');
        expect(context.shape).toBe('rounded');
        expect(context.align).toBe('center');
        expect(context.gap).toBe('sm');
        expect(context.elevation).toBe('xs');
    });

    it('should update context when component properties change', () => {
        component.variant = 'danger';
        component.size = 'sm';
        fixture.detectChanges();

        const context = fixture.debugElement.injector.get(UI_CARD_CONTEXT);
        expect(context.variant).toBe('danger');
        expect(context.size).toBe('sm');
    });
});
