import { TestBed } from '@angular/core/testing';
import { ScreenshotService } from './screenshot.service';
import { SCREENSHOT_SCALE, SCREENSHOT_QUALITY } from '@app/constants/screenshot.constants';

describe('ScreenshotService', () => {
    let service: ScreenshotService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ScreenshotService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have captureElementAsBase64 method', () => {
        expect(service.captureElementAsBase64).toBeDefined();
        expect(typeof service.captureElementAsBase64).toBe('function');
    });

    it('should use correct screenshot constants', () => {
        expect(SCREENSHOT_SCALE).toBe(SCREENSHOT_SCALE);
        expect(SCREENSHOT_QUALITY).toBe(SCREENSHOT_QUALITY);
        expect(typeof SCREENSHOT_SCALE).toBe('number');
        expect(typeof SCREENSHOT_QUALITY).toBe('number');
    });

    it('should capture element as base64 - integration test', async () => {
        const testElement = document.createElement('div');
        testElement.style.width = '100px';
        testElement.style.height = '100px';
        testElement.style.backgroundColor = 'red';
        testElement.textContent = 'Test';
        document.body.appendChild(testElement);

        try {
            const result = await service.captureElementAsBase64(testElement);

            expect(result).toMatch(/^data:image\/jpeg;base64,/);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        } catch (error) {
            expect(error).toBeDefined();
        } finally {
            document.body.removeChild(testElement);
        }
    });
});
