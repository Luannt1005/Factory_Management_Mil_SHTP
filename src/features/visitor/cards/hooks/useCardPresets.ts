'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardPreset, CardPresetSettings } from '@/types/visitor-card.types';
import { cardStudioApi, type PresetStorageMode } from '@/features/visitor/cards/services/cardStudioApi';

/**
 * Saved card templates with create / rename / overwrite / duplicate / delete.
 * Every mutation returns the affected template.
 */
export function useCardPresets() {
    const [savedPresets, setSavedPresets] = useState<CardPreset[]>([]);
    const [mode, setMode] = useState<PresetStorageMode>('server');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const result = await cardStudioApi.listPresets();
            setSavedPresets(result.presets);
            setMode(result.mode);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Failed to load card presets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const presets = useMemo(() => [...savedPresets].sort((a, b) => a.name.localeCompare(b.name)), [savedPresets]);

    const createPreset = useCallback(async (name: string, settings: CardPresetSettings) => {
        const preset = await cardStudioApi.createPreset({ name, settings }, mode);
        setSavedPresets((prev) => [...prev, preset].sort((a, b) => a.name.localeCompare(b.name)));
        return preset;
    }, [mode]);

    const updatePreset = useCallback(async (id: string, patch: { name?: string; settings?: CardPresetSettings }) => {
        const preset = await cardStudioApi.updatePreset(id, patch, mode);
        setSavedPresets((prev) => prev.map((p) => (p.id === id ? preset : p)));
        return preset;
    }, [mode]);

    const deletePreset = useCallback(async (id: string) => {
        await cardStudioApi.deletePreset(id, mode);
        setSavedPresets((prev) => prev.filter((p) => p.id !== id));
    }, [mode]);

    /** Suggests a free "<name> (copy)" / "<name> (copy 2)" name for duplicates */
    const suggestCopyName = useCallback((name: string) => {
        const taken = new Set(presets.map((p) => p.name.toLowerCase()));
        let candidate = `${name} (copy)`;
        let n = 2;
        while (taken.has(candidate.toLowerCase())) {
            candidate = `${name} (copy ${n++})`;
        }
        return candidate;
    }, [presets]);

    return {
        presets,
        mode,
        loading,
        loadError,
        reload,
        createPreset,
        updatePreset,
        deletePreset,
        suggestCopyName,
    };
}
