import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiIconComponent } from './icon.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { By } from '@angular/platform-browser';
import { FaIconKey, UiSize } from '@ui/types/ui.types';

describe('UiIconComponent', () => {
    let component: UiIconComponent;
    let fixture: ComponentFixture<UiIconComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiIconComponent, FontAwesomeModule],
        }).compileComponents();

        fixture = TestBed.createComponent(UiIconComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render FontAwesome icon', () => {
        component.iconName = 'Coffee';
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon).toBeTruthy();
    });

    it('should apply correct size class for small icons', () => {
        component.size = 'sm';
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon.classes['s-sm']).toBe(true);
    });

    it('should apply correct size class for medium icons', () => {
        component.size = 'md';
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon.classes['s-md']).toBe(true);
    });

    it('should apply correct size class for large icons', () => {
        component.size = 'lg';
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon.classes['s-lg']).toBe(true);
    });

    it('should default to medium size if no size is provided', () => {
        component.size = undefined as unknown as UiSize;
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon.classes['s-md']).toBe(true);
    });

    it('should handle invalid icon names gracefully', () => {
        component.iconName = 'InvalidIcon' as FaIconKey;
        fixture.detectChanges();

        const faIcon = fixture.debugElement.query(By.css('fa-icon'));
        expect(faIcon).toBeTruthy();
    });
});
