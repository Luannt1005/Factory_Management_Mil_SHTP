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

    // Default hover to first floor when opening if none hovered
    useEffect(() => {
        if (isOpen && !hoveredFloor && floors.length > 0) {
            setHoveredFloor(floors[0]);
        }
    }, [isOpen, floors, hoveredFloor]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
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
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#db011c]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[320px] sm:min-w-[450px] bg-white border border-gray-200 rounded-xl shadow-2xl flex overflow-hidden h-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
                    {floors.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-sm text-gray-500 italic">No rooms available</div>
                    ) : (
                        <>
                            {/* Left Column: Floors */}
                            <div className="w-[45%] sm:w-1/2 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
                                <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">Select Floor</div>
                                <ul className="pb-2">
                                    {floors.map(floor => (
                                        <li 
                                            key={floor}
                                            onMouseEnter={() => setHoveredFloor(floor)}
                                            onClick={() => setHoveredFloor(floor)}
                                            className={`px-3 py-2.5 mx-2 rounded-lg text-sm cursor-pointer flex justify-between items-center transition-all duration-200 ${hoveredFloor === floor ? 'bg-white text-[#db011c] font-bold shadow-sm ring-1 ring-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <span className="truncate pr-2">{floor}</span>
                                            <svg className={`w-4 h-4 flex-shrink-0 transition-opacity ${hoveredFloor === floor ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right Column: Rooms */}
                            <div className="w-[55%] sm:w-1/2 overflow-y-auto bg-white">
                                {hoveredFloor ? (
                                    <>
                                        <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10">Available Rooms</div>
                                        <ul className="pb-2">
                                            {groupedRooms[hoveredFloor].map((room: any) => (
                                                <li 
                                                    key={room.id}
                                                    className="px-3 py-2.5 mx-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-[#db011c] cursor-pointer font-medium transition-colors truncate"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onChange(`${hoveredFloor} - ${room.roomName}`);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    {room.roomName}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-400 italic px-4 text-center bg-gray-50/30">
                                        Hover over a floor to see rooms
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
