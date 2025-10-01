import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { SCREENSHOT_SCALE, SCREENSHOT_QUALITY } from '@app/constants/screenshot.constants';

@Injectable({
    providedIn: 'root',
})
export class ScreenshotService {
    async captureElementAsBase64(element: HTMLElement): Promise<string> {
        const canvas = await html2canvas(element, {
            scale: SCREENSHOT_SCALE,
        });
        return canvas.toDataURL('image/jpeg', SCREENSHOT_QUALITY);
    }
}
