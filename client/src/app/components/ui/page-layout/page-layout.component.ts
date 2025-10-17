import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiFooterComponent } from '@app/components/ui/footer/footer.component';
import { UiHeaderComponent } from '@app/components/ui/header/header.component';
import { UiSidebarComponent } from '@app/components/ui/sidebar/sidebar.component';
import { UiBaseComponent } from '@app/directives/ui-base/ui-base.component';

@Component({
    selector: 'app-ui-page-layout',
    standalone: true,
    imports: [NgClass, UiHeaderComponent, UiSidebarComponent, UiFooterComponent],
    templateUrl: './page-layout.component.html',
    styleUrl: './page-layout.component.scss',
})
export class UiPageLayoutComponent extends UiBaseComponent {
    @Input() hasHeader: boolean = false;
    @Input() hasSidebar: boolean = false;
    @Input() hasFooter: boolean = false;
    @Input() headerTitle?: string;
    @Input() headerSubtitle?: string;
    @Input() showBackButton: boolean = false;

    @Output() backClick = new EventEmitter<void>();
    @Output() menuItemClick = new EventEmitter<string>();

    onBackClick(): void {
        this.backClick.emit();
    }

    onMenuItemClick(item: string): void {
        this.menuItemClick.emit(item);
    }

    override get classes(): Record<string, boolean> {
        return {
            ...super.classes,
            uiPageLayout: true,
            hasSidebar: this.hasSidebar,
        };
    }
}
