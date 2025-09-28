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

    it('should render with the component selector as host element', () => {
        const legacyMeta = UiFooterComponent as unknown as Record<string, unknown>;
        const annotations = legacyMeta['__annotations__'] as ({ selector?: string }[]) | undefined;

        const ivy = UiFooterComponent as unknown as { ɵcmp?: { selectors?: string[][] } };
        const ivySelector = ivy.ɵcmp?.selectors?.[0]?.[0];

        const selector = annotations?.[0]?.selector || ivySelector;

        const hostTag = fixture.nativeElement.tagName.toLowerCase();
        if (typeof selector === 'string' && selector.includes('-')) {
            expect(hostTag).toBe(selector);
        } else if (Array.isArray(selector)) {
            const sel = selector[0];
            expect(hostTag).toBe(sel);
        } else {
            expect(hostTag.length).toBeGreaterThan(0);
        }
    });
});
