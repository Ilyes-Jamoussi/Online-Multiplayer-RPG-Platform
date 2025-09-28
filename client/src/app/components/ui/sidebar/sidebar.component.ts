import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { UiBaseComponent } from '@app/components/ui/base/ui-base.component';

@Component({
    selector: 'app-ui-sidebar',
    standalone: true,
    imports: [CommonModule],
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
