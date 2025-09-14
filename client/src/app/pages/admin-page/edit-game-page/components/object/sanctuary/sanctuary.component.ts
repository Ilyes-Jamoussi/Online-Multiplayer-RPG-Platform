import { Component } from '@angular/core';

@Component({
    selector: 'app-object-sanctuary',
    standalone: true,
    template: `
        <div class="sanctuary">
            <div class="overlay"></div>
            <div class="sanctuary-inner">
                <div class="icon">🏥</div>
                <div class="label">SANCTUARY</div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                /* read --tile from parent; compute proportional inset locally if you want */
                --inset: calc(var(--tile, 48px) * 0.12);
            }
            .sanctuary {
                width: 100%;
                height: 100%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;

                padding: var(--inset);
                border: 2px solid #10b981;
                border-radius: 8px;
                background-color: rgba(16, 185, 129, 0.08);

                pointer-events: none;
                z-index: 10;
            }
            .sanctuary-inner {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.55);
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
            }
            .icon {
                font-size: 1.4rem;
            }
            .label {
                margin-top: 4px;
                font-size: 0.7rem;
                font-weight: bold;
                text-align: center;
                color: #047857;
            }
            .overlay {
                position: absolute;
                inset: 0;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                pointer-events: none;
            }
        `,
    ],
})
export class SanctuaryComponent {}
