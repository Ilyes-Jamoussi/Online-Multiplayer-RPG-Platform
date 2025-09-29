import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { UiHeaderComponent } from './header.component';

describe('UiHeaderComponent', () => {
    let fixture: ComponentFixture<UiHeaderComponent>;
    let component: UiHeaderComponent;
    let locationSpy: jasmine.SpyObj<Location>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('Location', ['back']);

        await TestBed.configureTestingModule({
            imports: [UiHeaderComponent],
            providers: [{ provide: Location, useValue: spy }],
        }).compileComponents();

        fixture = TestBed.createComponent(UiHeaderComponent);
        component = fixture.componentInstance;
        locationSpy = TestBed.inject(Location) as jasmine.SpyObj<Location>;
    });

    it('should create with default inputs', () => {
        expect(component).toBeTruthy();
        expect(component.title).toBeUndefined();
        expect(component.subtitle).toBeUndefined();
        expect(component.showBackButton).toBeFalse();
    });

    it('should render title when provided', () => {
        const testTitle = 'Header Title';
        component.title = testTitle;
        fixture.detectChanges();

        const el = fixture.debugElement.nativeElement as HTMLElement;
        expect(el.textContent).toContain(testTitle);
    });

    it('should emit backClick when observed', () => {
        component.showBackButton = true;
        fixture.detectChanges();

        let emitted = false;
        component.backClick.subscribe(() => (emitted = true));

        component.onBack();
        expect(emitted).toBeTrue();
        expect(locationSpy.back).not.toHaveBeenCalled();
    });

    it('should call location.back() when backClick not observed', () => {
        component.onBack();
        expect(locationSpy.back).toHaveBeenCalled();
    });
});
