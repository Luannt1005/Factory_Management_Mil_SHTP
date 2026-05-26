import Link from 'next/link';
import { cookies } from 'next/headers';
import DepartmentSlider from '@/components/DepartmentSlider';
import OrgChartView from '@/app/orgchart/OrgChartView';
import HeroVideo from '@/components/HeroVideo';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const legacyToken = cookieStore.get('auth')?.value;

  // Hỗ trợ cả session mới (NextAuth) và token cũ (legacy auth cookie)
  const token = session || legacyToken;

  // With our system, user always comes from internal login or AD, so redirect to login if no token.
  const orgchartLink = token ? "/orgchart" : "/login?redirect=/orgchart";
  const requestLink = token ? "/visitorrequest" : "/login?redirect=/visitorrequest";

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-[#db011c] to-[#900112] text-white font-sans overflow-y-auto">
      {/* Hero Section */}
      {token ? (
        <HeroVideo>
          <div className="text-center py-6">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-red-200 uppercase">
              Connect Your Facility<br />
              Experience Secure Entry
            </h1>
            <p className="text-[#ffe5e5] text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed">
              Bridge the gap between safety and efficiency with our modern management systems. Fast access, seamless tracking, and total security across Milwaukee SHTP Staging.
            </p>

            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                href={requestLink}
                className="inline-flex items-center justify-center px-10 py-4 rounded-md text-lg font-bold text-[#db011c] bg-white border border-white hover:bg-white/95 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
              >
                Request Visitor
              </Link>
              <Link
                href="/visitordashboard"
                className="inline-flex items-center justify-center px-10 py-4 rounded-md text-lg font-bold text-white border-2 border-white/50 hover:border-white hover:bg-white/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
              >
                My Dashboard
              </Link>
            </div>
          </div>
        </HeroVideo>
      ) : (
        <section className="w-full max-w-7xl mx-auto px-8 pt-24 pb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-red-200 uppercase">
            Connect Your Facility<br />
            Experience Secure Entry
          </h1>
          <p className="text-[#ffe5e5] text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed">
            Bridge the gap between safety and efficiency with our modern management systems. Fast access, seamless tracking, and total security across Milwaukee SHTP Staging.
          </p>

          <div className="flex flex-wrap gap-6 justify-center mb-16">
            <Link
              href={requestLink}
              className="inline-flex items-center justify-center px-10 py-4 rounded-md text-lg font-bold text-[#db011c] bg-white border border-white hover:bg-white/95 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
            >
              Request Visitor
            </Link>
          </div>
        </section>
      )}

      {/* Departments Section */}
      <section className="w-full mb-32">
        <div className="w-full max-w-7xl mx-auto px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight">Our Departments</h2>
          <p className="text-center text-xl text-[#ffe5e5] mb-16 max-w-3xl mx-auto">
            Explore the various divisions driving innovation and excellence at our facility.
          </p>

          <DepartmentSlider />
        </div>
      </section>

      {/* Interactive OrgChart Section */}
      <section className="w-full mb-32 bg-white/5 py-16 border-y border-white/10">
        <div className="w-full max-w-[90rem] mx-auto px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Interactive Organization Preview</h2>
            <p className="text-[#ffe5e5] text-lg max-w-2xl mx-auto">
              Pan, zoom, and explore our organizational structure right from the home page.
            </p>
          </div>

          <div className="w-full h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative">
            <div className="absolute inset-0 bg-white">
              <OrgChartView />
            </div>
            {!token && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 text-center flex-col">
                <div className="text-6xl mb-6">🔒</div>
                <h3 className="text-3xl font-extrabold text-white mb-4">Login Required</h3>
                <p className="text-[#ffe5e5] text-lg max-w-md mb-8">
                  You must be logged in to view the interactive Organization Chart.
                </p>
                <Link href="/login?redirect=/orgchart" className="px-8 py-3 bg-[#db011c] hover:bg-[#b90118] text-white rounded-full font-bold transition-colors shadow-lg">
                  Login to Access
                </Link>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/orgchart"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-lg font-bold text-white bg-white/10 border-2 border-white hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
            >
              Explore Full Organization Details
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="w-full bg-black/20 py-16 mt-auto border-t border-white/10">
        <div className="w-full max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Need Assistance?</h2>
          <p className="text-lg text-[#ffe5e5] max-w-2xl mb-10">
            If you have any issues with your visitor request or need further technical support, our teams are here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-10 w-full">
            <div className="bg-white/10 p-8 rounded-2xl min-w-[320px] backdrop-blur-md">
              <h3 className="text-2xl font-bold mb-2 text-white">Contact Lobby</h3>
              <p className="text-[#ffe5e5] mb-6 text-sm">For visitor check-ins & general inquiries</p>
              <p className="font-semibold text-xl mb-2">📞 (555) 012-3456</p>
              <p className="font-semibold text-xl">✉️ lobby@milwaukeetool.com</p>
            </div>
            <div className="bg-white/10 p-8 rounded-2xl min-w-[320px] backdrop-blur-md">
              <h3 className="text-2xl font-bold mb-2 text-white">IT Support Center</h3>
              <p className="text-[#ffe5e5] mb-6 text-sm">For technical issues & system accounts</p>
              <p className="font-semibold text-xl mb-2">📞 (555) 987-6543</p>
              <p className="font-semibold text-xl">✉️ it.support@milwaukeetool.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}