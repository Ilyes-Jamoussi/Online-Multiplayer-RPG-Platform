import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ScreenshotService {
    async captureElementAsBase64(element: HTMLElement): Promise<string> {
        const canvas = await html2canvas(element);
        return canvas.toDataURL('image/png');
    }
}
