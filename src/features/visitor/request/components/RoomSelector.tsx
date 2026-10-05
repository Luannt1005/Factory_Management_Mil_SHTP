'use client';

import React from 'react';
import type { FacilityRoom } from '@/types/rooms.types';
import { SectionHeader } from './FormControls';

export interface RoomSelectorProps {
    rooms: FacilityRoom[];
    visitingSite: string;
    selectedRoomIds: string[];
    onToggleRoom: (roomId: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
    rooms,
    visitingSite,
    selectedRoomIds,
    onToggleRoom
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
                    <div className={"grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3"}>
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
