import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFooterComponent } from './footer.component';

describe('UiFooterComponent', () => {
    let component: UiFooterComponent;
    let fixture: ComponentFixture<UiFooterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiFooterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiFooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the footer component', () => {
        expect(component).toBeTruthy();
    });
});
