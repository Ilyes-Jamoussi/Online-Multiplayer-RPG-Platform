import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiBaseComponent } from '@app/shared/ui/components/base/ui-base.component';
import { UiHeaderComponent } from '@app/shared/ui/components/header/header.component';
import { UiSidebarComponent } from '@app/shared/ui/components/sidebar/sidebar.component';
import { UiFooterComponent } from '@app/shared/ui/components/footer/footer.component';

@Component({
  selector: 'app-ui-page-layout',
  standalone: true,
  imports: [CommonModule, UiHeaderComponent, UiSidebarComponent, UiFooterComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss'
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
