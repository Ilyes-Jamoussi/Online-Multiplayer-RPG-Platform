import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSpinnerComponent } from './spinner.component';

describe('UiSpinnerComponent', () => {
    let component: UiSpinnerComponent;
    let fixture: ComponentFixture<UiSpinnerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiSpinnerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiSpinnerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default variant and size', () => {
        expect(component.variant).toBe('primary');
        expect(component.size).toBe('md');
    });

    it('should generate correct classes with defaults', () => {
        const classes = component.classes;
        expect(classes['uiSpinner']).toBe(true);
        expect(classes['v-primary']).toBe(true);
        expect(classes['s-md']).toBe(true);
    });

    it('should generate correct classes with custom variant', () => {
        component.variant = 'secondary';
        const classes = component.classes;
        expect(classes['uiSpinner']).toBe(true);
        expect(classes['v-secondary']).toBe(true);
        expect(classes['s-md']).toBe(true);
    });

    it('should generate correct classes with custom size', () => {
        component.size = 'lg';
        const classes = component.classes;
        expect(classes['uiSpinner']).toBe(true);
        expect(classes['v-primary']).toBe(true);
        expect(classes['s-lg']).toBe(true);
    });

    it('should generate correct classes with custom variant and size', () => {
        component.variant = 'danger';
        component.size = 'sm';
        const classes = component.classes;
        expect(classes['uiSpinner']).toBe(true);
        expect(classes['v-danger']).toBe(true);
        expect(classes['s-sm']).toBe(true);
    });
});
