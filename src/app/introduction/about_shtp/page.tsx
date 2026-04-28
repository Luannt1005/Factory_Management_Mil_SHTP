import React from 'react';

export default function AboutSHTP() {
    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight">
                    About <span className="text-[#db011c]">SHTP</span>
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Saigon Hi-Tech Park (SHTP) Facility Information and Visitor Process.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* General Information Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-8 bg-[#db011c] rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">General Information</h2>
                    </div>
                    <div className="space-y-4 text-gray-600 leading-relaxed">
                        <p>
                            Milwaukee Tool is situated in the Saigon Hi-Tech Park (SHTP), one of Vietnam's leading centers for technology and manufacturing. SHTP provides world-class infrastructure and a strategic location that allows us to operate efficiently and effectively on a global scale.
                        </p>
                        <p>
                            Our facility is designed with modern manufacturing principles and a focus on safety, sustainability, and technological innovation. It serves as a key hub for our regional operations.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-[#db011c]">
                            <li><strong>Location:</strong> Saigon Hi-Tech Park, District 9, Ho Chi Minh City</li>
                            <li><strong>Focus:</strong> Advanced Manufacturing & R&D Support</li>
                            <li><strong>Standards:</strong> Global Quality and Safety Compliance</li>
                        </ul>
                    </div>
                </div>

                {/* Visitor Process Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Visitor Process</h2>
                    </div>
                    <div className="space-y-4 text-gray-600 leading-relaxed">
                        <p>
                            For a smooth and secure experience, all visitors to our SHTP facility must follow the designated registration and check-in procedures.
                        </p>
                        
                        <div className="space-y-6 mt-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Pre-Registration</h3>
                                    <p className="text-sm mt-1">Submit a registration request via our Visitor Management application prior to arrival. Approval is required before entry.</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
                                <div>
                                    <h3 className="font-bold text-gray-900">On-site Check-in</h3>
                                    <p className="text-sm mt-1">Upon arrival, proceed to the main reception/security desk. Present your valid ID or Passport to receive your visitor badge.</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Safety & Compliance</h3>
                                    <p className="text-sm mt-1">Visitors must wear their badge at all times. A brief safety induction will be required for factory floor access.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Gallery or Banner */}
            <div className="w-full h-64 bg-gray-200 rounded-3xl overflow-hidden relative shadow-inner">
                <img src="/visitor_header.png" alt="SHTP Facility" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end p-8">
                    <h3 className="text-white text-2xl font-bold">State-of-the-Art Operations</h3>
                </div>
            </div>
        </div>
    );
}
