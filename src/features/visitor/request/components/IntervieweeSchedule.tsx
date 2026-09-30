'use client';

import React from 'react';
import MeetingRoomCascader from './MeetingRoomCascader';
import type { MeetingRoom } from '@/types/rooms.types';
import { InputLabel, FormInput } from './FormControls';

export interface IntervieweeScheduleProps {
    startDate: string;
    startTime: string;
    interviewArea: string;
    todayStr: string;
    meetingRooms: MeetingRoom[];
    onStartDateChange: (date: string) => void;
    onStartTimeChange: (time: string) => void;
    onInterviewAreaChange: (area: string) => void;
}

export const IntervieweeSchedule: React.FC<IntervieweeScheduleProps> = ({
    startDate,
    startTime,
    interviewArea,
    todayStr,
    meetingRooms,
    onStartDateChange,
    onStartTimeChange,
    onInterviewAreaChange
}) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <div>
                <InputLabel required>Start Date</InputLabel>
                <FormInput 
                    type="date" 
                    required 
                    min={todayStr} 
                    value={startDate} 
                    onChange={(e) => onStartDateChange(e.target.value)} 
                />
            </div>
            <div>
                <InputLabel required>Start Time</InputLabel>
                <FormInput 
                    type="time" 
                    required 
                    value={startTime} 
                    onChange={(e) => onStartTimeChange(e.target.value)} 
                />
            </div>
            <div>
                <InputLabel required>Interview Area</InputLabel>
                <MeetingRoomCascader 
                    meetingRooms={meetingRooms} 
                    value={interviewArea} 
                    onChange={onInterviewAreaChange}
                />
            </div>
        </div>
    );
};
