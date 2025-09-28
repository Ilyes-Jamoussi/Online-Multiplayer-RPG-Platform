import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIcons } from '@common/enums/fa-icons.enum';
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

    it('iconValue should reflect FaIcons mapping and fallback to FaceMeh', () => {
        // use concrete enum keys to avoid magic strings
        component.iconName = Object.keys(FaIcons)[0] as keyof typeof FaIcons;
        const firstKey = component.iconName;
        expect(component.iconValue).toBe(FaIcons[firstKey]);

        // invalid key simulated by casting an unknown key should fallback
        component.iconName = 'NonExistingKey' as keyof typeof FaIcons;
        expect(component.iconValue).toBe(FaIcons.FaceMeh);
    });

    it('iconSize should map size input to IconSizes correctly', () => {
        // test all known sizes using the enum mapping
        component.size = 'sm';
        expect(component.iconSize).toBe(IconSizes.SM);

        component.size = 'md';
        expect(component.iconSize).toBe(IconSizes.MD);

        component.size = 'lg';
        expect(component.iconSize).toBe(IconSizes.LG);

        // default when size unknown
        component.size = 'unknown' as any;
        expect(component.iconSize).toBe(IconSizes.MD);
    });
});
