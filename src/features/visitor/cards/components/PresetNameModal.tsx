'use client';

import { useEffect, useState } from 'react';
import { PRESET_NAME_MAX_LENGTH } from '@/features/visitor/cards/utils/cardPresetSettings';
import StudioModal, { studioInputClass, studioLabelClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

export type PresetNameMode = 'create' | 'rename' | 'duplicate';

const COPY: Record<PresetNameMode, { title: string; action: string; hint: string }> = {
    create: { title: 'Save template', action: 'Save template', hint: 'Saves the current card layout, colours and texts as a named template.' },
    rename: { title: 'Rename template', action: 'Rename', hint: 'Only the name changes; the card design stays the same.' },
    duplicate: { title: 'Duplicate template', action: 'Duplicate', hint: 'Creates a copy you can customise without changing the original.' },
};

interface PresetNameModalProps {
    mode: PresetNameMode | null;
    initialName: string;
    onSubmit: (name: string) => Promise<void>;
    onClose: () => void;
}

export default function PresetNameModal({ mode, initialName, onSubmit, onClose }: PresetNameModalProps) {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(initialName);
        setError(null);
    }, [initialName, mode]);

    if (!mode) return null;
    const copy = COPY[mode];
    const trimmed = name.trim();

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!trimmed) {
            setError('Please enter a setting name');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSubmit(trimmed);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save setting');
        } finally {
            setSaving(false);
        }
    };

    return (
        <StudioModal
            open
            eyebrow="Card template"
            title={copy.title}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className={studioSecondaryButtonClass} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className={studioPrimaryButtonClass} onClick={() => handleSubmit()} disabled={saving || !trimmed}>
                        {saving ? 'Saving...' : copy.action}
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <label htmlFor="preset-name" className={studioLabelClass}>Template name</label>
                <input
                    id="preset-name"
                    autoFocus
                    value={name}
                    maxLength={PRESET_NAME_MAX_LENGTH}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. "Thẻ Nhà Thầu Thi Công - SHTP"'
                    className={studioInputClass}
                />
                <p className="mt-2 text-xs text-gray-500">{copy.hint}</p>
                {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
            </form>
        </StudioModal>
    );
}
