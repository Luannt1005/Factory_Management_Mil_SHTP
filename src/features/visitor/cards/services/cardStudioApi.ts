/**
 * Visitor Card Studio API Service
 * Orgchart_TTI_onprem
 *
 * Presets are shared through /api/visitor_admin/card-presets (Visitor_database).
 * When that storage is unavailable (table not migrated / API down) the studio keeps working
 * on presets stored in this browser's localStorage.
 */

import type {
    CardPreset,
    CardPresetApiResponse,
    CardPresetPayload,
    CardPresetRow,
    CardPresetsApiResponse,
    CardSourceRecord,
    CardSourcesApiResponse,
} from '@/types/visitor-card.types';
import { normalizeCardSettings } from '@/features/visitor/cards/utils/cardPresetSettings';

const ENDPOINTS = {
    PRESETS: '/api/visitor_admin/card-presets',
    CARD_SOURCES: '/api/visitor_admin/card-sources',
} as const;

const LOCAL_PRESETS_KEY = 'visitorCardStudio.presets.v1';
const SERVER_CACHE_KEY = 'visitorCardStudio.serverCache.v1';

export type PresetStorageMode = 'server' | 'local';

export class CardStudioApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'CardStudioApiError';
    }
}

async function handleResponse<T>(res: Response, defaultMessage: string): Promise<T> {
    if (!res.ok) {
        let errorMsg = defaultMessage;
        try {
            const data = await res.json();
            errorMsg = data.error || data.message || defaultMessage;
        } catch {
            // keep default message
        }
        throw new CardStudioApiError(errorMsg, res.status);
    }
    return res.json() as Promise<T>;
}

function fromRow(row: CardPresetRow): CardPreset {
    return {
        id: row.id,
        name: row.name,
        settings: normalizeCardSettings(row.settings),
        builtIn: false,
        createdBy: row.created_by,
        updatedAt: row.updated_at,
    };
}

// ===============================
// localStorage helpers (wrapped: storage can be blocked)
// ===============================

function readStorage(key: string): CardPreset[] {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((p): p is { id: string; name: string; settings: unknown; updatedAt?: string } =>
                typeof p === 'object' && p !== null && typeof p.id === 'string' && typeof p.name === 'string')
            .map((p) => ({ id: p.id, name: p.name, settings: normalizeCardSettings(p.settings), builtIn: false, updatedAt: p.updatedAt ?? null }));
    } catch {
        return [];
    }
}

function writeStorage(key: string, presets: CardPreset[]): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(presets));
    } catch {
        // storage full / blocked: presets stay in memory for this session
    }
}

function nameTaken(presets: CardPreset[], name: string, exceptId?: string): boolean {
    return presets.some((p) => p.id !== exceptId && p.name.trim().toLowerCase() === name.trim().toLowerCase());
}

function newLocalId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `local-${crypto.randomUUID()}`
        : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ===============================
// Presets
// ===============================

export const cardStudioApi = {
    ENDPOINTS,

    /**
     * Loads shared presets; falls back to local presets (and the last server cache) when the
     * shared storage cannot be reached.
     */
    async listPresets(): Promise<{ presets: CardPreset[]; mode: PresetStorageMode }> {
        try {
            const res = await fetch(ENDPOINTS.PRESETS);
            const data = await handleResponse<CardPresetsApiResponse>(res, 'Failed to load card presets');
            const presets = data.presets.map(fromRow);
            writeStorage(SERVER_CACHE_KEY, presets);
            return { presets, mode: 'server' };
        } catch (err) {
            if (err instanceof CardStudioApiError && (err.status === 401 || err.status === 403)) throw err;
            const local = readStorage(LOCAL_PRESETS_KEY);
            if (local.length === 0) {
                // Seed local mode with the last known shared presets so nothing disappears offline
                const cached = readStorage(SERVER_CACHE_KEY);
                if (cached.length > 0) writeStorage(LOCAL_PRESETS_KEY, cached);
                return { presets: cached, mode: 'local' };
            }
            return { presets: local, mode: 'local' };
        }
    },

    async createPreset(payload: CardPresetPayload, mode: PresetStorageMode): Promise<CardPreset> {
        if (mode === 'local') {
            const presets = readStorage(LOCAL_PRESETS_KEY);
            if (nameTaken(presets, payload.name)) throw new CardStudioApiError('A preset with this name already exists', 409);
            const preset: CardPreset = {
                id: newLocalId(),
                name: payload.name.trim(),
                settings: normalizeCardSettings(payload.settings),
                builtIn: false,
                updatedAt: new Date().toISOString(),
            };
            writeStorage(LOCAL_PRESETS_KEY, [...presets, preset]);
            return preset;
        }
        const res = await fetch(ENDPOINTS.PRESETS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await handleResponse<CardPresetApiResponse>(res, 'Failed to save card preset');
        return fromRow(data.preset);
    },

    async updatePreset(id: string, patch: Partial<CardPresetPayload>, mode: PresetStorageMode): Promise<CardPreset> {
        if (mode === 'local') {
            const presets = readStorage(LOCAL_PRESETS_KEY);
            const existing = presets.find((p) => p.id === id);
            if (!existing) throw new CardStudioApiError('Preset not found', 404);
            if (patch.name !== undefined && nameTaken(presets, patch.name, id)) {
                throw new CardStudioApiError('A preset with this name already exists', 409);
            }
            const updated: CardPreset = {
                ...existing,
                name: patch.name !== undefined ? patch.name.trim() : existing.name,
                settings: patch.settings !== undefined ? normalizeCardSettings(patch.settings) : existing.settings,
                updatedAt: new Date().toISOString(),
            };
            writeStorage(LOCAL_PRESETS_KEY, presets.map((p) => (p.id === id ? updated : p)));
            return updated;
        }
        const res = await fetch(`${ENDPOINTS.PRESETS}/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        const data = await handleResponse<CardPresetApiResponse>(res, 'Failed to update card preset');
        return fromRow(data.preset);
    },

    async deletePreset(id: string, mode: PresetStorageMode): Promise<void> {
        if (mode === 'local') {
            writeStorage(LOCAL_PRESETS_KEY, readStorage(LOCAL_PRESETS_KEY).filter((p) => p.id !== id));
            return;
        }
        const res = await fetch(`${ENDPOINTS.PRESETS}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        await handleResponse<{ message: string }>(res, 'Failed to delete card preset');
    },

    // ===============================
    // Visitor source data
    // ===============================

    /**
     * Cards (with the complete field set) for a request code, visitor code (…V2) or interviewee code
     */
    async lookupCardSources(code: string): Promise<CardSourceRecord[]> {
        const res = await fetch(`${ENDPOINTS.CARD_SOURCES}?code=${encodeURIComponent(code)}`);
        const data = await handleResponse<CardSourcesApiResponse>(res, 'Failed to look up visitor request');
        return data.cards || [];
    },
};
