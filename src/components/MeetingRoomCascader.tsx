'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function MeetingRoomCascader({ 
    meetingRooms, 
    value, 
    onChange 
}: { 
    meetingRooms: any[], 
    value: string, 
    onChange: (val: string) => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Group rooms by floor
    const groupedRooms = meetingRooms.reduce((acc, room) => {
        if (!acc[room.floorName]) acc[room.floorName] = [];
        acc[room.floorName].push(room);
        return acc;
    }, {} as Record<string, any[]>);

    const floors = Object.keys(groupedRooms);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setHoveredFloor(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                className={`w-full h-[40px] px-3 flex items-center justify-between border border-gray-300 rounded-lg text-sm bg-gray-50 hover:bg-white transition-colors cursor-pointer ${value ? 'text-black' : 'text-gray-500'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate block pr-4">{value || 'Select Meeting Room'}</span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                    {floors.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No rooms available</div>
                    ) : (
                        <ul className="max-h-60 overflow-y-auto relative">
                            {floors.map(floor => (
                                <li 
                                    key={floor}
                                    className="relative"
                                    onMouseEnter={() => setHoveredFloor(floor)}
                                >
                                    <div className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center ${hoveredFloor === floor ? 'bg-red-50 text-[#db011c] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        <span className="truncate">{floor}</span>
                                        <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>

                                    {/* Submenu for Rooms */}
                                    {hoveredFloor === floor && (
                                        <div className="absolute left-full top-0 w-[200px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 -ml-1 z-50">
                                            <ul className="max-h-60 overflow-y-auto">
                                                {groupedRooms[floor].map((room: any) => (
                                                    <li 
                                                        key={room.id}
                                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-[#db011c] cursor-pointer font-medium truncate"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onChange(`${floor} - ${room.roomName}`);
                                                            setIsOpen(false);
                                                            setHoveredFloor(null);
                                                        }}
                                                    >
                                                        {room.roomName}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
