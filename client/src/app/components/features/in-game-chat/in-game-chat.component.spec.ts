import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InGameChatComponent } from './in-game-chat.component';

// Test constants
const CHAT_SECTION_CLASS = 'chat-section';
const CHAT_TITLE_CLASS = 'chat-title';
const CHAT_TITLE_TEXT = 'CLAVARDAGE :';
const MESSAGES_CONTAINER_CLASS = 'messages-container';
const MESSAGES_CLASS = 'messages';
const CHAT_INPUT_CLASS = 'chat-input';
const CHAT_INPUT_TYPE = 'text';
const CHAT_INPUT_PLACEHOLDER = 'Tapez votre message...';
const INPUT_DISABLED_ATTRIBUTE = 'disabled';

describe('InGameChatComponent', () => {
    let component: InGameChatComponent;
    let fixture: ComponentFixture<InGameChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InGameChatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InGameChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Template rendering', () => {
        it('should render chat section container', () => {
            const chatSection = fixture.nativeElement.querySelector(`.${CHAT_SECTION_CLASS}`);
            expect(chatSection).toBeTruthy();
        });

        it('should render chat title with correct text', () => {
            const chatTitle = fixture.nativeElement.querySelector(`.${CHAT_TITLE_CLASS}`);
            expect(chatTitle).toBeTruthy();
            expect(chatTitle.textContent.trim()).toBe(CHAT_TITLE_TEXT);
        });

        it('should render messages container', () => {
            const messagesContainer = fixture.nativeElement.querySelector(`.${MESSAGES_CONTAINER_CLASS}`);
            expect(messagesContainer).toBeTruthy();
        });

        it('should render messages div inside messages container', () => {
            const messagesContainer = fixture.nativeElement.querySelector(`.${MESSAGES_CONTAINER_CLASS}`);
            const messages = messagesContainer?.querySelector(`.${MESSAGES_CLASS}`);
            expect(messages).toBeTruthy();
        });

        it('should render chat input with correct attributes', () => {
            const chatInput = fixture.nativeElement.querySelector(`.${CHAT_INPUT_CLASS}`) as HTMLInputElement;
            expect(chatInput).toBeTruthy();
            expect(chatInput.type).toBe(CHAT_INPUT_TYPE);
            expect(chatInput.placeholder).toBe(CHAT_INPUT_PLACEHOLDER);
            expect(chatInput.disabled).toBe(true);
        });

        it('should have input element with disabled attribute', () => {
            const chatInput = fixture.nativeElement.querySelector(`input.${CHAT_INPUT_CLASS}`);
            expect(chatInput).toBeTruthy();
            expect(chatInput.hasAttribute(INPUT_DISABLED_ATTRIBUTE)).toBe(true);
        });
    });
});

