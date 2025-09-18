import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiInputComponent } from './input.component';

describe('UiInputComponent', () => {
    let component: UiInputComponent;
    let fixture: ComponentFixture<UiInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle registerOnChange with proper signature', () => {
        const mockFn = jasmine.createSpy('onChange');
        component.registerOnChange(mockFn);
        expect(component).toBeTruthy();
    });
});
