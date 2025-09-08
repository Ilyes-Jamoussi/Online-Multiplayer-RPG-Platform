/** THIS IS A MOCK SERVICE */

import { Injectable } from '@angular/core';
import { Game } from '@app/shared/models/game.model';
import { delay, map, Observable, of } from 'rxjs';

const DB: Game[] = [
    {
        id: '1',
        name: 'Mock Game 1',
        mapSize: '10x10',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        lastEdit: new Date().toISOString(),
        visible: false,
        description: '',
    },
    {
        id: '2',
        name: 'Mock Game 2',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '3',
        name: 'Mock Game 3',
        mapSize: '15x15',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '4',
        name: 'Mock Game 4',
        mapSize: '20x20',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '5',
        name: 'Mock Game 5',
        mapSize: '15x15',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '6',
        name: 'Mock Game 6',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '7',
        name: 'Mock Game 7',
        mapSize: '20x20',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '8',
        name: 'Mock Game 8',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '9',
        name: 'Mock Game 9',
        mapSize: '10x10',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '10',
        name: 'Mock Game 10',
        mapSize: '20x20',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '11',
        name: 'Mock Game 11',
        mapSize: '10x10',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '12',
        name: 'Mock Game 12',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '13',
        name: 'Mock Game 13',
        mapSize: '15x15',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '14',
        name: 'Mock Game 14',
        mapSize: '20x20',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '15',
        name: 'Mock Game 15',
        mapSize: '20x20',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '16',
        name: 'Mock Game 16',
        mapSize: '20x20',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '17',
        name: 'Mock Game 17',
        mapSize: '20x20',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        lastEdit: new Date().toISOString(),
        visible: true,
        description: '',
    },
    {
        id: '18',
        name: 'Mock Game 18',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        lastEdit: new Date().toISOString(),
        visible: false,
        description: '',
    },
    {
        id: '19',
        name: 'Mock Game 19',
        mapSize: '10x10',
        gameMode: 'classique',
        previewImageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        lastEdit: new Date().toISOString(),
        visible: false,
        description: '',
    },
    {
        id: '20',
        name: 'Mock Game 20',
        mapSize: '15x15',
        gameMode: 'ctf',
        previewImageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        lastEdit: new Date().toISOString(),
        visible: false,
        description: '',
    },
];

function clone<T>(v: T): T {
    return structuredClone(v);
}

/** TODO: Implement real API calls */
@Injectable({ providedIn: 'root' })
export class GamesApiService {
    // private http = inject(HttpClient);
    // private readonly baseUrl = 'api/games';

    private readonly latencyMs = 500;

    list$(): Observable<Game[]> {
        return of(DB).pipe(
            delay(this.latencyMs),
            map((arr) => clone(arr).sort((a, b) => b.lastEdit.localeCompare(a.lastEdit))),
        );
    }

    getById$(id: string): Observable<Game | undefined> {
        return of(DB.find((g) => g.id === id)).pipe(
            delay(this.latencyMs),
            map((g) => (g ? clone(g) : undefined)),
        );
    }

    create$(input: Omit<Game, 'id' | 'lastEdit'>): Observable<Game> {
        const game: Game = { ...input, id: crypto.randomUUID(), lastEdit: new Date().toISOString() };
        DB.push(game);
        return of(clone(game)).pipe(delay(this.latencyMs));
    }

    update$(id: string, patch: Partial<Omit<Game, 'id'>>): Observable<Game | undefined> {
        const i = DB.findIndex((g) => g.id === id);
        if (i === -1) return of(undefined).pipe(delay(this.latencyMs));
        DB[i] = { ...DB[i], ...patch, lastEdit: new Date().toISOString() };
        return of(clone(DB[i])).pipe(delay(this.latencyMs));
    }

    setVisibility$(id: string, visible: boolean): Observable<Game | undefined> {
        return this.update$(id, { visible });
    }

    delete$(id: string): Observable<boolean> {
        const i = DB.findIndex((g) => g.id === id);
        if (i === -1) return of(false).pipe(delay(this.latencyMs));
        DB.splice(i, 1);
        return of(true).pipe(delay(this.latencyMs));
    }

    // todo : other methods as needed like search by name, filter by mode, etc.
}
