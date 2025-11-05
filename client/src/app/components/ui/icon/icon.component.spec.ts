import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSize } from '@app/types/ui.types';
import { FaIcons } from '@app/enums/fa-icons.enum';
import { IconSizes, UiIconComponent } from './icon.component';

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

    it('iconValue should reflect FaIcons mapping and fallback to FaceMeh', () => {
        component.iconName = Object.keys(FaIcons)[0] as keyof typeof FaIcons;
        const firstKey = component.iconName;
        expect(component.iconValue).toBe(FaIcons[firstKey]);

        component.iconName = 'NonExistingKey' as keyof typeof FaIcons;
        expect(component.iconValue).toBe(FaIcons.FaceMeh);
    });

    it('iconSize should map size input to IconSizes correctly', () => {
        component.size = 'sm';
        expect(component.iconSize).toBe(IconSizes.SM);

        component.size = 'md';
        expect(component.iconSize).toBe(IconSizes.MD);

        component.size = 'lg';
        expect(component.iconSize).toBe(IconSizes.LG);

        component.size = 'unknown' as unknown as UiSize;
        expect(component.iconSize).toBe(IconSizes.MD);
    });
});
