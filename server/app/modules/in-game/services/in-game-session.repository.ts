import { Injectable, NotFoundException } from '@nestjs/common';
import { InGameSession } from '@common/models/session.interface';

@Injectable()
export class InGameSessionRepository {
    private readonly sessions = new Map<string, InGameSession>();

    save(session: InGameSession): void {
        this.sessions.set(session.id, session);
    }

    findById(sessionId: string): InGameSession {
        const session = this.sessions.get(sessionId);
        if (!session) throw new NotFoundException('Session not found');
        return session;
    }

    update(session: InGameSession): void {
        this.sessions.set(session.id, session);
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}
