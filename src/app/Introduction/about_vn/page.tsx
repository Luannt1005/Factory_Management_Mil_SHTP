import React from 'react';

export default function AboutVietnam() {
    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight">
                    About <span className="text-[#db011c]">Vietnam</span>
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Investments, footprint, and growth strategy of Milwaukee Tool in Vietnam.
                </p>
            </header>

            <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-bl-full -mr-20 -mt-20 z-0"></div>
                
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-2 h-8 bg-[#db011c] rounded-full"></div>
                            <h2 className="text-3xl font-bold text-gray-900">Our Footprint</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Vietnam represents a cornerstone of our global supply chain and manufacturing strategy. Over the recent years, we have significantly accelerated our investment in the region to support robust growth and to ensure proximity to key engineering talent and logistical hubs.
                        </p>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Through continuous expansion, local hiring, and community engagement, our presence in Vietnam not only strengthens our global delivery capabilities but also contributes actively to the local technological ecosystem and economy.
                        </p>
                        
                        <div className="pt-6 grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-4xl font-black text-[#db011c]">2000+</h4>
                                <p className="text-gray-500 text-sm font-semibold mt-2 uppercase tracking-wide">Local Employees</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-4xl font-black text-[#db011c]">Multiple</h4>
                                <p className="text-gray-500 text-sm font-semibold mt-2 uppercase tracking-wide">Facilities</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                        {/* Placeholder for Vietnam map or facility image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <svg className="w-48 h-48 text-slate-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Strategic Location</h3>
                    <p className="text-gray-600">Access to robust logistics networks, seaports, and international airports facilitates fast deployment worldwide.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Local Talent</h3>
                    <p className="text-gray-600">Partnering with local universities and technical schools to cultivate a high-skill engineering and manufacturing workforce.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Sustainability</h3>
                    <p className="text-gray-600">Committed to environmental standards and sustainable manufacturing practices within our Vietnam facilities.</p>
                 </div>
            </div>
        </div>
    );
}
