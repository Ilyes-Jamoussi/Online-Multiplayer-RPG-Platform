import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTooltipComponent } from './tooltip.component';
import { CommonModule } from '@angular/common';

describe('UiTooltipComponent', () => {
    let component: UiTooltipComponent;
    let fixture: ComponentFixture<UiTooltipComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiTooltipComponent, CommonModule],
        }).compileComponents();

        fixture = TestBed.createComponent(UiTooltipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show tooltip on hover', () => {
        component.showTooltip();
        expect(component.isVisible).toBeTrue();
    });

    it('should hide tooltip on mouse leave', () => {
        component.hideTooltip();
        expect(component.isVisible).toBeFalse();
    });
});
