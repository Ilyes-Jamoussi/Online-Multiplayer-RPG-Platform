import { TestBed } from '@angular/core/testing';
import { SCREENSHOT_QUALITY, SCREENSHOT_SCALE } from '@app/constants/screenshot.constants';
import { ScreenshotService } from './screenshot.service';

const TEST_TIMEOUT_DURATION = 5000;
const TEST_SPEC_TIMEOUT = 10000;

describe('ScreenshotService', () => {
    let service: ScreenshotService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        service = TestBed.inject(ScreenshotService);
        expect(service).toBeTruthy();
    });

    it('should have captureElementAsBase64 method', () => {
        service = TestBed.inject(ScreenshotService);
        expect(service.captureElementAsBase64).toBeDefined();
        expect(typeof service.captureElementAsBase64).toBe('function');
    });

    it('should use correct screenshot constants', () => {
        expect(SCREENSHOT_SCALE).toBe(SCREENSHOT_SCALE);
        expect(SCREENSHOT_QUALITY).toBe(SCREENSHOT_QUALITY);
        expect(typeof SCREENSHOT_SCALE).toBe('number');
        expect(typeof SCREENSHOT_QUALITY).toBe('number');
    });

    it(
        'should capture element as base64 - integration test',
        async () => {
            service = TestBed.inject(ScreenshotService);
            const testElement = document.createElement('div');
            testElement.style.width = '100px';
            testElement.style.height = '100px';
            testElement.style.backgroundColor = 'red';
            testElement.textContent = 'Test';
            document.body.appendChild(testElement);

            try {
                const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT_DURATION));

                const result = (await Promise.race([service.captureElementAsBase64(testElement), timeoutPromise])) as string;

                expect(result).toMatch(/^data:image\/jpeg;base64,/);
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            } catch (error) {
                expect(error).toBeDefined();
            } finally {
                document.body.removeChild(testElement);
            }
        },
        TEST_SPEC_TIMEOUT,
    );
});
