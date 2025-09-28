import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTooltipComponent } from './tooltip.component';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

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
        component.text = 'Test Tooltip';
        const tooltipContainer = fixture.debugElement.query(By.css('.tooltip-container'));
        tooltipContainer.triggerEventHandler('mouseenter', {});
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(component.isVisible).toBeTrue();
        expect(tooltipElement).toBeTruthy();
        expect(tooltipElement.classList).toContain('visible');
    });

    it('should hide tooltip on mouse leave', () => {
        const tooltipContainer = fixture.debugElement.query(By.css('.tooltip-container'));
        tooltipContainer.triggerEventHandler('mouseleave', {});
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(component.isVisible).toBeFalse();
        expect(tooltipElement).not.toHaveClass('visible');
    });

    it('should display the correct text', () => {
        component.text = 'Test Tooltip';
        component.showTooltip();
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(tooltipElement.textContent).toContain('Test Tooltip');
    });

    it('should apply the correct position class', () => {
        component.position = 'bottom';
        component.showTooltip();
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(tooltipElement.classList).toContain('bottom');
    });

    it('should apply the correct distance class', () => {
        component.distance = 'lg';
        component.showTooltip();
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(tooltipElement.classList).toContain('dist-lg');
    });

    it('should not show tooltip when text is empty', () => {
        component.text = '';
        component.showTooltip();
        fixture.detectChanges();

        const tooltipElement = fixture.debugElement.query(By.css('.uiTooltip')).nativeElement;
        expect(component.isVisible).toBeFalse();
        expect(tooltipElement).not.toHaveClass('visible');
    });
});
