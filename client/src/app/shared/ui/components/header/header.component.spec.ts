import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UiHeaderComponent } from './header.component';

describe('UiHeaderComponent', () => {
    let fixture: ComponentFixture<UiHeaderComponent>;
    let component: UiHeaderComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiHeaderComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(UiHeaderComponent);
        component = fixture.componentInstance;
    });

    it('should create with default inputs', () => {
        expect(component).toBeTruthy();
        expect(component.title).toBeUndefined();
        expect(component.subtitle).toBeUndefined();
        expect(component.showBackButton).toBeFalse();
    });

    it('should render title and subtitle when provided', () => {
        const testTitle = 'Header Title';
        const testSubtitle = 'Header Subtitle';
        component.title = testTitle;
        component.subtitle = testSubtitle;
        fixture.detectChanges();

        const el = fixture.debugElement.nativeElement as HTMLElement;
        expect(el.textContent).toContain(testTitle);
        expect(el.textContent).toContain(testSubtitle);
    });

    it('should show back button when showBackButton is true and emit on click', () => {
        component.showBackButton = true;
        fixture.detectChanges();

        const btn = fixture.debugElement.query(By.css('button'));
        expect(btn).toBeTruthy();

        let emitted = false;
        component.backClick.subscribe(() => (emitted = true));

        component.onBackClick();
        expect(emitted).toBeTrue();
    });
});
