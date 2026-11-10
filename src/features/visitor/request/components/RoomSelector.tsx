'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FacilityRoom } from '@/types/rooms.types';
import { needsApproverChoice, parseApproverEmails } from '@/utils/roomApprovers';
import { SectionHeader } from './FormControls';

export interface RoomSelectorProps {
    rooms: FacilityRoom[];
    visitingSite: string;
    selectedRoomIds: string[];
    onToggleRoom: (roomId: string) => void;
    /** Approver picked per room, for rooms whose approval mode is "selected" */
    roomApprovers: Record<string, string>;
    onSelectApprover: (roomId: string, email: string) => void;
}

interface ApproverSelectProps {
    emails: string[];
    value: string | undefined;
    onChange: (email: string) => void;
}

/** Compact dropdown: one approver of the room's list. Floats over the grid so the cards keep their size. */
const ApproverSelect: React.FC<ApproverSelectProps> = ({ emails, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        // A click here must not untick the room card around it
        <div ref={rootRef} className="relative mt-2.5 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[11px] font-bold text-slate-600">
                Approver <span className="text-mwk">*</span>
            </div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                title={value}
                className={`flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-white px-2.5 text-left text-xs transition-colors ${open ? 'border-mwk' : 'border-slate-300 hover:border-slate-400'}`}
            >
                <span className={`truncate ${value ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>{value || 'Select approver'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </button>
            {open && (
                <div role="listbox" aria-label="Approver" className="custom-scrollbar absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {emails.map((email) => {
                        const active = email === value;
                        return (
                            <button
                                key={email}
                                type="button"
                                role="option"
                                aria-selected={active}
                                title={email}
                                onClick={() => {
                                    onChange(email);
                                    setOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${active ? 'bg-mwk-soft font-semibold text-mwk' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                <span className="truncate">{email}</span>
                                {active && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const RoomSelector: React.FC<RoomSelectorProps> = ({
    rooms,
    visitingSite,
    selectedRoomIds,
    onToggleRoom,
    roomApprovers,
    onSelectApprover
}) => {
    const filteredRooms = rooms.filter(
        room => visitingSite === 'SHTP/DDK' || room.site_location === visitingSite
    );

    const ratio = rooms.length > 0 ? (selectedRoomIds.length / rooms.length) : 0;
    const isBULeaderTriggered = ratio > 0.6;

    return (
        <>
            <SectionHeader title="Select Rooms" />
            {rooms.length === 0 ? (
                <div className="text-[13px] text-slate-500 italic">No rooms available.</div>
            ) : (
                <>
                    <div className={"grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-3"}>
                        {filteredRooms.map(room => {
                            const isSelected = selectedRoomIds.includes(room.id);
                            return (
                                <div 
                                    key={room.id}
                                    onClick={() => onToggleRoom(room.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'border-2 border-mwk bg-mwk-soft' : 'border border-slate-200 bg-white'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? 'bg-mwk' : 'border border-slate-300 bg-white'}`}>
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className={`font-extrabold text-[13px] ${isSelected ? 'text-mwk' : 'text-slate-800'}`}>
                                            {room.name}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-500 pl-6">{room.description || 'No description'}</div>
                                    {isSelected && needsApproverChoice(room.approval_mode, room.approver_email) && (
                                        <ApproverSelect
                                            emails={parseApproverEmails(room.approver_email)}
                                            value={roomApprovers[room.id]}
                                            onChange={(email) => onSelectApprover(room.id, email)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className={`mt-3 py-2.5 px-3.5 border-l-4 rounded text-[12px] flex items-start gap-2 ${isBULeaderTriggered ? 'bg-red-100 border-red-500 text-red-800' : 'bg-green-100 border-green-500 text-green-800'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                            {isBULeaderTriggered ? (
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                            ) : (
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                            )}
                        </svg>
                        <span className="font-medium">
                            {isBULeaderTriggered ? (
                                <><strong>Over 60% of total rooms selected ({Math.round(ratio * 100)}%):</strong> This request WILL BE additionally sent to BU Leader for approval.</>
                            ) : (
                                <><strong>Note:</strong> If over 60% of total rooms are selected, the request will additionally be sent to BU Leader for approval. (Current: {Math.round(ratio * 100)}%)</>
                            )}
                        </span>
                    </div>
                </>
            )}
        </>
    );
};
