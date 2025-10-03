import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with welcome message', () => {
        expect(component.messages).toEqual(['Bienvenue dans le chat !']);
    });

    it('should display messages in the template', () => {
        const messageElements = fixture.debugElement.queryAll(By.css('.message'));
        expect(messageElements.length).toBe(component.messages.length);
        expect(messageElements[0].nativeElement.textContent.trim()).toBe('Bienvenue dans le chat !');
    });

    it('should have correct structure', () => {
        const container = fixture.debugElement.query(By.css('.chat-container'));
        const title = fixture.debugElement.query(By.css('h3'));
        const messagesContainer = fixture.debugElement.query(By.css('.messages'));

        expect(container).toBeTruthy();
        expect(title).toBeTruthy();
        expect(messagesContainer).toBeTruthy();
        expect(title.nativeElement.textContent).toContain('Chat');
    });
});
