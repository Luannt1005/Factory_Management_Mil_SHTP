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
                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No rooms available.</div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                        {filteredRooms.map(room => {
                            const isSelected = selectedRoomIds.includes(room.id);
                            return (
                                <div 
                                    key={room.id}
                                    onClick={() => onToggleRoom(room.id)}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '8px', 
                                        border: isSelected ? '2px solid #db011c' : '1px solid #e2e8f0',
                                        backgroundColor: isSelected ? '#fff5f5' : 'white', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <div style={{ 
                                            width: '16px', 
                                            height: '16px', 
                                            borderRadius: '4px', 
                                            border: isSelected ? 'none' : '1px solid #cbd5e1', 
                                            backgroundColor: isSelected ? '#db011c' : 'white', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center' 
                                        }}>
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '12px', height: '12px' }}>
                                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? '#db011c' : '#1e293b' }}>
                                            {room.name}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '24px' }}>{room.description || 'No description'}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ 
                        marginTop: '12px', 
                        padding: '10px 14px', 
                        backgroundColor: isBULeaderTriggered ? '#fee2e2' : '#dcfce7', 
                        borderLeft: `4px solid ${isBULeaderTriggered ? '#ef4444' : '#22c55e'}`, 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        color: isBULeaderTriggered ? '#991b1b' : '#166534', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '8px' 
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }}>
                            {isBULeaderTriggered ? (
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                            ) : (
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                            )}
                        </svg>
                        <span style={{ fontWeight: 500 }}>
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
