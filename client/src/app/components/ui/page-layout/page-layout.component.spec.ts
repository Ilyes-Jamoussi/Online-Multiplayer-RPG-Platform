import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiPageLayoutComponent } from './page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';

describe('UiPageLayoutComponent', () => {
    let component: UiPageLayoutComponent;
    let fixture: ComponentFixture<UiPageLayoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiPageLayoutComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiPageLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
        expect(component.hasHeader).toBeFalse();
        expect(component.hasSidebar).toBeFalse();
        expect(component.hasFooter).toBeFalse();
        expect(component.showBackButton).toBeFalse();
        expect(component.headerTitle).toBeUndefined();
        expect(component.headerSubtitle).toBeUndefined();
    });

    it('should emit backClick when onBackClick is called', () => {
        spyOn(component.backClick, 'emit');

        component.onBackClick();

        expect(component.backClick.emit).toHaveBeenCalled();
    });

    it('should emit menuItemClick with ROUTES value when onMenuItemClick is called', () => {
        spyOn(component.menuItemClick, 'emit');

        component.onMenuItemClick(ROUTES.homePage);

        expect(component.menuItemClick.emit).toHaveBeenCalledWith(ROUTES.homePage);
    });

    it('classes getter should include uiPageLayout and reflect hasSidebar input', () => {
        const classesDefault = component.classes;
        expect(classesDefault.uiPageLayout).toBeTrue();
        expect(classesDefault.hasSidebar).toBeFalse();

        component.hasSidebar = true;
        const classesWithSidebar = component.classes;
        expect(classesWithSidebar.uiPageLayout).toBeTrue();
        expect(classesWithSidebar.hasSidebar).toBeTrue();
    });

    it('should accept headerTitle and headerSubtitle inputs', () => {
        const title = 'Titre de test';
        const subtitle = 'Sous-titre de test';
        component.headerTitle = title;
        component.headerSubtitle = subtitle;
        expect(component.headerTitle).toBe(title);
        expect(component.headerSubtitle).toBe(subtitle);
    });
});
