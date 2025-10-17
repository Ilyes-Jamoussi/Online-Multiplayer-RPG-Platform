import { NgClass } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { UiBaseComponent } from '@app/directives/ui-base/ui-base.component';

@Component({
    selector: 'app-ui-sidebar',
    standalone: true,
    imports: [NgClass],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class UiSidebarComponent extends UiBaseComponent {
    @Output() menuItemClick = new EventEmitter<string>();

    onMenuItemClick(item: string): void {
        this.menuItemClick.emit(item);
    }

    override get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            uiSidebar: true,
        };
    }
}
