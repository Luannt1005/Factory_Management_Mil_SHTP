const fs = require('fs');
const path = 'c:/Users/luan.nguyen/Desktop/test org/Orgchart_TTI_onprem/src/app/visitorrequest/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for meeting rooms
code = code.replace(
    `const [hostDepartments, setHostDepartments] = useState<any[]>([]);`,
    `const [hostDepartments, setHostDepartments] = useState<any[]>([]);\n    const [meetingRooms, setMeetingRooms] = useState<any[]>([]);`
);

// 2. Fetch meeting rooms in useEffect
code = code.replace(
    `        fetchHostDepartments();`,
    `        fetchHostDepartments();\n        fetchMeetingRooms();`
);

code = code.replace(
    `    const fetchHostDepartments = async () => {`,
    `    const fetchMeetingRooms = async () => {\n        try {\n            const res = await fetch('/api/admin/meeting-rooms');\n            if (res.ok) {\n                const data = await res.json();\n                setMeetingRooms(data.meetingRooms || []);\n            }\n        } catch (error) {\n            console.error('Failed to fetch meeting rooms:', error);\n        }\n    };\n\n    const fetchHostDepartments = async () => {`
);

// 3. Replace the Input with a Select
const oldInput = `<Input type="text" required placeholder="e.g. Meeting Room 4" value={formData.interviewArea} onChange={(e: any) => setFormData({...formData, interviewArea: e.target.value})} />`;
const newSelect = `
                                                <select 
                                                    required 
                                                    className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                                    value={formData.interviewArea} 
                                                    onChange={(e: any) => setFormData({...formData, interviewArea: e.target.value})}
                                                >
                                                    <option value="" disabled>Select Meeting Room</option>
                                                    {meetingRooms.map(room => (
                                                        <option key={room.id} value={\`\${room.floorName} - \${room.roomName}\`}>
                                                            {room.floorName} - {room.roomName}
                                                        </option>
                                                    ))}
                                                </select>
`;

code = code.replace(oldInput, newSelect);

fs.writeFileSync(path, code);
