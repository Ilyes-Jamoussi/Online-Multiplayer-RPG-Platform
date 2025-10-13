import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ROUTES } from '@app/constants/routes.constants';
import { UiSidebarComponent } from './sidebar.component';

describe('UiSidebarComponent', () => {
    let component: UiSidebarComponent;
    let fixture: ComponentFixture<UiSidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiSidebarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiSidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should emit menuItemClick with ROUTES.home when onMenuItemClick is called', (done) => {
        const expected = ROUTES.homePage;
        component.menuItemClick.subscribe((value: string) => {
            expect(value).toBe(expected);
            done();
        });

        component.onMenuItemClick(expected);
    });
});
