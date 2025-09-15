import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiIconComponent } from './icon.component';

describe('UiIconComponent', () => {
    let component: UiIconComponent;
    let fixture: ComponentFixture<UiIconComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiIconComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiIconComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.iconName).toBe('Coffee');
        expect(component.size).toBe('md');
    });

    it('should accept valid icon names', () => {
        component.iconName = 'Plus';
        expect(component.iconName).toBe('Plus');
    });

    it('should handle size changes', () => {
        component.size = 'sm';
        expect(component.size).toBe('sm');

        component.size = 'lg';
        expect(component.size).toBe('lg');
    });

    it('should handle different icon names', () => {
        component.iconName = 'Trash';
        expect(component.iconName).toBe('Trash');
    });
});
