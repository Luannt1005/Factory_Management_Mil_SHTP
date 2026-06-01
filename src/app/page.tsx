import Link from 'next/link';
import { cookies } from 'next/headers';
import DepartmentSlider from '@/components/DepartmentSlider';
import OrgChartView from '@/app/orgchart/OrgChartView';
import HeroVideo from '@/components/HeroVideo';
import ScrollReveal from '@/components/ScrollReveal';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const cultureExpectations = [
  {
    id: 'user_focused',
    num: '01',
    title: 'USER FOCUSED, SOLUTION DRIVEN',
    logo: '/landing_page/User Focused Solution Driven.png',
    desc: 'Our Brand is centered on the journey of our users – from the moment they wake up, to the time they go to bed. <strong>We are deeply committed to understanding their requirements for working safely and more productively.</strong> Our mission is not just to provide solutions for their needs, but also to <strong>revolutionize how their work is done</strong>, in ways they hadn\'t imagined.'
  },
  {
    id: 'candid',
    num: '02',
    title: 'CANDID',
    logo: '/landing_page/CANDID.png',
    desc: 'The commitment to be <strong>Candid</strong> fuels our culture. We lead with questions, <strong>seeking to understand</strong> and building <strong>trust</strong>. We <strong>proactively identify</strong> and address obstacles and opportunities, <strong>giving</strong> and <strong>receiving</strong> respectful feedback with the right people at the right time.'
  },
  {
    id: 'extreme_ownership',
    num: '03',
    title: 'EXTREME OWNERSHIP',
    logo: '/landing_page/Extreme Ownership.png',
    desc: 'Extreme Ownership encourages thinking beyond one\'s current role, with a <strong>\'Total Company\' mindset</strong>. To excel, we need to exercise Extreme Ownership in planning and execution across all business areas, emphasizing <strong>personal accountability</strong> for results, in dynamic environments. This involves prioritizing deliverables, engaging the right teams, driving escalation, and considering multiple solutions.'
  },
  {
    id: 'disruptive_mindset',
    num: '04',
    title: 'DISRUPTIVE MINDSET',
    logo: '/landing_page/Disruptive Mindset.png',
    desc: '<strong>Change is not an option</strong>, it\'s our driving force. We <strong>don\'t</strong> just adapt. We <strong>don\'t</strong> just invent. We <strong>disrupt</strong>. Our journey is defined by a relentless march towards innovation and transformation.'
  },
  {
    id: 'relentless_improvement',
    num: '05',
    title: 'RELENTLESS IMPROVEMENT',
    logo: '/landing_page/Relentless improvement.png',
    desc: 'Relentless improvement is our <strong>proactive problem-solving approach</strong> aimed at enhancing results, productivity, and efficiencies. By challenging the status quo, we ensure <strong>continual growth</strong> of our business, teams, and ourselves.'
  },
  {
    id: 'speed_agility_urgency',
    num: '06',
    title: 'SPEED, AGILITY, AND URGENCY',
    logo: '/landing_page/Speed Agility and Urgency.png',
    desc: 'Speed is core to our planning and execution. Our <strong>agility empowers us</strong> not only to <strong>anticipate</strong> and <strong>identify</strong> multiple <strong>viable solutions</strong> to complex challenges, but also to <strong>prioritize</strong> how we respond and act with a <strong>sense of urgency</strong>.'
  },
  {
    id: 'one_team_mentality',
    num: '07',
    title: 'ONE TEAM MENTALITY',
    logo: '/landing_page/One team mentality.png',
    desc: 'Within our <strong>collaborative culture</strong>, everyone is respected, listened to, valued, and actively involved. We consistently nurture, communicate, and celebrate our team successes, embracing a collective spirit of <strong>winning together</strong>.'
  }
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const legacyToken = cookieStore.get('auth')?.value;

  // Hỗ trợ cả session mới (NextAuth) và token cũ (legacy auth cookie)
  const token = session || legacyToken;

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-[#db011c] to-[#900112] text-white font-sans">
      {/* Hero Section */}
      {token ? (
        <HeroVideo>
          <div className="py-6" />
        </HeroVideo>
      ) : (
        <section className="w-full px-8 md:px-16 py-6 text-center" />
      )}

      {/* Milwaukee Culture Section */}
      <section className="w-full bg-transparent py-24">
        {/* Style block for staggered children reveal and logo spin */}
        <style dangerouslySetInnerHTML={{ __html: `
          .reveal-active .expect-logo {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: all 800ms cubic-bezier(0.16, 1, 0.3, 1) 100ms;
          }
          .reveal-active .expect-desc {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: all 800ms cubic-bezier(0.16, 1, 0.3, 1) 250ms;
          }
          .culture-logo-reveal {
            transform: rotate(-360deg) scale(0.2);
            opacity: 0;
            transition: all 1200ms cubic-bezier(0.16, 1, 0.3, 1) 50ms;
          }
          .reveal-active .culture-logo-reveal {
            transform: rotate(0) scale(1);
            opacity: 1;
          }
        `}} />
        <div className="w-full px-8 md:px-16 max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 mb-20">
            <ScrollReveal delay={150} className="text-center md:text-left">
              <h2 className="text-4xl md:text-[3.25rem] font-black text-white leading-none tracking-tight">MILWAUKEE CULTURE</h2>
              <p className="text-base md:text-xl font-black tracking-[0.25em] text-white mt-4 uppercase">
                7 CULTURE EXPECTATIONS
              </p>
            </ScrollReveal>
            <ScrollReveal delay={50}>
              <img 
                src="/landing_page/Milwaukee Culture Logo.png" 
                alt="Milwaukee Culture Logo" 
                className="h-36 md:h-48 w-auto drop-shadow-[0_10px_30px_rgba(219,1,28,0.35)] hover:scale-105 transition-transform duration-300 culture-logo-reveal"
              />
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cultureExpectations.map((item, idx) => {
              const isLast = idx === cultureExpectations.length - 1;
              const delay = (idx % 3) * 100;
              return (
                <div 
                  key={item.id}
                  className={`${isLast ? 'md:col-span-2 lg:col-span-3 lg:max-w-4xl lg:mx-auto w-full' : ''} flex flex-col`}
                >
                  <ScrollReveal delay={delay} className="h-full flex-1 flex flex-col">
                    <div className="group relative w-full flex-1 flex flex-col bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#db011c]/30 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      
                      {/* Logo and Number placed together in a flex row to prevent any clipping/cutoff */}
                      <div className="flex justify-between items-center mb-6 opacity-0 translate-y-4 expect-logo">
                        <div className="h-12 flex items-center">
                          <img 
                            src={item.logo} 
                            alt={item.title} 
                            className="h-full w-auto object-contain" 
                          />
                        </div>
                        <div className="text-4xl font-black text-white/20 group-hover:text-[#db011c]/60 transition-colors duration-500 font-sans select-none pointer-events-none">
                          {item.num}
                        </div>
                      </div>

                      <p 
                        className="text-sm md:text-base text-white/90 leading-relaxed font-normal opacity-0 translate-y-4 expect-desc" 
                        dangerouslySetInnerHTML={{ 
                          __html: item.desc.replace(/<strong>/g, '<strong class="text-white/90 font-medium">').replace(/<\/strong>/g, '</strong>') 
                        }} 
                      />
                    </div>
                  </ScrollReveal>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Departments Section */}
      <section className="w-full pt-20 pb-20 bg-transparent">
        <div className="w-full px-8 md:px-16 max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight">Our Departments</h2>
            <p className="text-center text-xl text-[#ffe5e5] mb-16 max-w-3xl mx-auto">
              Explore the various divisions driving innovation and excellence at our facility.
            </p>
          </ScrollReveal>

          <DepartmentSlider />
        </div>
      </section>

      {/* Contact Section */}
      <ScrollReveal>
        <section className="w-full bg-transparent py-24">
          <div className="w-full px-8 md:px-16">

            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">Contact</h2>
              <div className="w-24 h-1 bg-[#db011c] mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">

              {/* SHTP Reception Card - text only, out of box */}
              <div className="flex flex-col items-center md:items-start md:mr-auto w-full max-w-md group">
                <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-8 relative inline-block">
                  SHTP Reception Desk
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-12 h-1 bg-white group-hover:w-full transition-all duration-500"></span>
                </h3>
                <div className="space-y-6 w-full">
                  <a href="tel:+8402873088869" className="flex items-start gap-4 text-xl text-white/80 hover:text-white transition-colors group/link">
                    <span className="w-24 shrink-0 text-white font-bold transition-transform group-hover/link:translate-x-1">Tel:</span>
                    <span className="font-light">(+84) 0287 3088 869 <span className="text-white/50 text-sm ml-1 block sm:inline">(Ext: 66797)</span></span>
                  </a>
                  <a href="mailto:MILVNSHTPReception@ttigroup.com.vn" className="flex items-start gap-4 text-xl text-white/80 hover:text-white transition-colors group/link">
                    <span className="w-24 shrink-0 text-white font-bold transition-transform group-hover/link:translate-x-1">Email:</span>
                    <span className="font-light break-all">MILVNSHTPReception@ttigroup.com.vn</span>
                  </a>
                </div>
              </div>

              {/* EHS Team Card */}
              <div className="flex flex-col items-center md:items-start md:ml-auto w-full max-w-md group">
                <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-8 relative inline-block">
                  EHS Team
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-12 h-1 bg-white group-hover:w-full transition-all duration-500"></span>
                </h3>
                <div className="space-y-6 w-full">
                  <a href="tel:0961958951" className="flex items-start gap-4 text-xl text-white/80 hover:text-white transition-colors group/link">
                    <span className="w-24 shrink-0 text-white font-bold transition-transform group-hover/link:translate-x-1">Hotline:</span>
                    <span className="font-light">0961 958 951</span>
                  </a>
                  <a href="mailto:TTIVNMILPTEHS@ttigroup.com.vn" className="flex items-start gap-4 text-xl text-white/80 hover:text-white transition-colors group/link">
                    <span className="w-24 shrink-0 text-white font-bold transition-transform group-hover/link:translate-x-1">Email:</span>
                    <span className="font-light break-all">TTIVNMILPTEHS@ttigroup.com.vn</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}