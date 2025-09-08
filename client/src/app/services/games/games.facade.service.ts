import { Injectable, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GamesApiService } from './games-api.service';
import { Game } from '@app/shared/models/game.model';

type SortKey = 'lastEdit' | 'name';
type Filter = {
    name?: string;
    mode?: 'classique' | 'ctf' | 'all';
    size?: '10x10' | '15x15' | '20x20' | 'all';
    visibility?: 'all' | 'visible' | 'hidden';
};

@Injectable({ providedIn: 'root' })
export class GamesFacade {
    private readonly api = inject(GamesApiService);
    private readonly destroyRef = inject(DestroyRef);

    private _games = signal<Game[]>([]);
    private _loading = signal<boolean>(false);
    private _error = signal<string | null>(null);

    private _sortKey = signal<SortKey>('lastEdit');
    private _sortDir = signal<'asc' | 'desc'>('desc');
    private _filter = signal<Filter>({ mode: 'all', size: 'all', visibility: 'all' });

    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());

    readonly gamesRaw = computed(() => this._games());

    readonly games = computed(() => {
        const list = this._games();
        const f = this._filter();
        const sKey = this._sortKey();
        const sDir = this._sortDir();

        let out = list.filter((g) => {
            const byName = !f.name || g.name.toLowerCase().includes(f.name.toLowerCase());
            const byMode = (f.mode ?? 'all') === 'all' || g.gameMode === f.mode;
            const bySize = (f.size ?? 'all') === 'all' || g.mapSize === f.size;
            const byVis = (f.visibility ?? 'all') === 'all' ? true : f.visibility === 'visible' ? g.visible : !g.visible;
            return byName && byMode && bySize && byVis;
        });

        out = [...out].sort((a, b) => {
            const cmp = sKey === 'lastEdit' ? a.lastEdit.localeCompare(b.lastEdit) : a.name.localeCompare(b.name);
            return sDir === 'asc' ? cmp : -cmp;
        });

        return out;
    });

    readonly totalCount = computed(() => this._games().length);
    readonly visibleCount = computed(() => this._games().filter((g) => g.visible).length);
    readonly hiddenCount = computed(() => this._games().length - this.visibleCount());

    /** Functions Calling API SERVICE */
    /** function to refresh the game list (should be called on init with ngOnInit) */
    refresh(): void {
        this._loading.set(true);
        this._error.set(null);

        this.api
            .list$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (items) => {
                    const sorted = [...items].sort((a, b) => b.lastEdit.localeCompare(a.lastEdit));
                    this._games.set(sorted);
                    this._loading.set(false);
                },
                error: (err) => {
                    this._error.set(err?.message ?? 'Erreur de chargement');
                    this._loading.set(false);
                },
            });
    }

    /** function to toggle the visibility of a game */
    toggleVisibility(id: string, visible: boolean): void {
        const prev = this._games();
        this._games.update((list) => list.map((g) => (g.id === id ? { ...g, visible } : g)));

        this.api
            .setVisibility$(id, visible)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    if (!updated) {
                        this._games.set(prev);
                    } else {
                        this._games.update((list) => list.map((g) => (g.id === id ? updated : g)));
                    }
                },
                error: () => this._games.set(prev),
            });
    }

    /** function to delete a game */
    delete(id: string): void {
        const prev = this._games();
        this._games.set(prev.filter((g) => g.id !== id));

        this.api
            .delete$(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (ok) => {
                    if (!ok) this._games.set(prev);
                },
                error: () => this._games.set(prev),
            });
    }

    /** function to create a new game (no id and no lastEdit, handled by the API automatically) */
    create(input: Omit<Game, 'id' | 'lastEdit'>, cb?: (created: Game) => void): void {
        this.api
            .create$(input)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (created) => {
                    this._games.update((list) => [created, ...list]);
                    cb?.(created);
                },
            });
    }

    /** function to update a game (no id, handled by the API automatically) */
    update(id: string, patch: Partial<Omit<Game, 'id'>>, cb?: (updated: Game) => void): void {
        const prev = this._games();
        this._games.update((list) => list.map((g) => (g.id === id ? ({ ...g, ...patch } as Game) : g)));

        this.api
            .update$(id, patch)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updated) => {
                    if (!updated) {
                        this._games.set(prev);
                        return;
                    }
                    this._games.update((list) => list.map((g) => (g.id === id ? updated : g)));
                    cb?.(updated);
                },
                error: () => this._games.set(prev),
            });
    }

    /** Local functions to update filters / update the UI */

    setQuery(query: string | undefined) {
        this._filter.update((f) => ({ ...f, name: query?.trim() || undefined }));
    }
    setMode(mode: Filter['mode']) {
        this._filter.update((f) => ({ ...f, mode: mode ?? 'all' }));
    }
    setSize(size: Filter['size']) {
        this._filter.update((f) => ({ ...f, size: size ?? 'all' }));
    }
    setVisibilityFilter(v: Filter['visibility']) {
        this._filter.update((f) => ({ ...f, visibility: v ?? 'all' }));
    }
    setSort(key: SortKey, dir: 'asc' | 'desc') {
        this._sortKey.set(key);
        this._sortDir.set(dir);
    }

    getSnapshotById(id: string): Game | undefined {
        return this._games().find((g) => g.id === id);
    }
}
