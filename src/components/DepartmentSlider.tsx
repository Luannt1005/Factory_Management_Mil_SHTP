'use client';
import ScrollReveal from '@/components/ScrollReveal';

const departments = [
  {
    id: 'management',
    title: 'Management',
    subtitle: 'Strategic Leadership',
    desc: 'Oversees overall business strategy, organizational direction, and cross-departmental alignment to ensure company goals are met.',
    img: '/landing_page/management.png'
  },
  {
    id: 'scm',
    title: 'Supply Chain Management',
    subtitle: 'SCM',
    desc: 'Manages procurement, logistics, and supplier relationships to ensure materials and components flow efficiently through the production process.',
    img: '/landing_page/scm.png'
  },
  {
    id: 'opm',
    title: 'Operations Project Management',
    subtitle: 'OPM',
    desc: 'Plans and coordinates operational projects, tracking timelines, resources, and deliverables to drive continuous improvement initiatives.',
    img: '/landing_page/opm.png'
  },
  {
    id: 'engineering',
    title: 'Engineering',
    subtitle: 'Product & Process Design',
    desc: 'Develops and maintains product and process designs, providing technical solutions to support manufacturing efficiency and product quality.',
    img: '/landing_page/engineering.png'
  },
  {
    id: 'ee_mt',
    title: 'EE / MT',
    subtitle: 'Electrical & Motor Eng',
    desc: 'Designs and develops electrical systems and motor technologies to ensure optimal performance, reliability, and efficiency of power tool products.',
    img: '/landing_page/ee_mt.png'
  },
  {
    id: 'ie_fmu_mif',
    title: 'IE / FMU / MIF',
    subtitle: 'Industrial & Facility Eng',
    desc: 'Optimizes production workflows and facility infrastructure through industrial engineering methods, while investigating and mitigating operational risks and disruptions on the factory floor.',
    img: '/landing_page/ie_fmu_mif.png'
  },
  {
    id: 'ame_auto_opex',
    title: 'AME / Auto / Opex',
    subtitle: 'Advanced Manufacturing',
    desc: 'Drives automation integration and operational excellence programs to enhance productivity and reduce waste on the factory floor.',
    img: '/landing_page/ame_auto_opex.png'
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    subtitle: 'Production Operations',
    desc: 'Executes day-to-day production operations, ensuring output targets, efficiency, and safety standards are consistently achieved.',
    img: '/landing_page/manufacturing.png'
  },
  {
    id: 'quality',
    title: 'Quality',
    subtitle: 'Quality Assurance',
    desc: 'Monitors and enforces product and process quality standards through inspection, testing, and corrective action to meet customer and compliance requirements.',
    img: '/landing_page/quality.png'
  },
  {
    id: 'ehs_esg',
    title: 'EHS / ESG',
    subtitle: 'Safety & Sustainability',
    desc: 'Ensures a safe and compliant workplace while driving sustainability and corporate responsibility initiatives aligned with global ESG standards.',
    img: '/landing_page/ehs_esg.png'
  }
];

export default function DepartmentSlider() {
  return (
    <div className="w-full pb-20">
      {/* Styles for Staggered Parallax Scroll Entrance */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dept-image {
          transform: scale(0.9) rotate(-1deg);
          opacity: 0;
          transition: all 850ms cubic-bezier(0.16, 1, 0.3, 1) 50ms;
        }
        .reveal-active .dept-image {
          transform: scale(1) rotate(0);
          opacity: 1;
        }
        .dept-title {
          transform: translateY(15px);
          opacity: 0;
          transition: all 700ms cubic-bezier(0.16, 1, 0.3, 1) 180ms;
        }
        .reveal-active .dept-title {
          transform: translateY(0);
          opacity: 1;
        }
        .dept-desc {
          transform: translateY(15px);
          opacity: 0;
          transition: all 700ms cubic-bezier(0.16, 1, 0.3, 1) 280ms;
        }
        .reveal-active .dept-desc {
          transform: translateY(0);
          opacity: 1;
        }
      `}} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12 lg:gap-y-16">
        {departments.map((dept, idx) => {
          // Stagger delays based on column index
          const delay = (idx % 2) * 100;
          // Row-by-row alternating checkerboard logic (alternates every 2 departments)
          const isReversed = Math.floor(idx / 2) % 2 === 1;

          return (
            <div key={dept.id} className="w-full">
              <ScrollReveal delay={delay}>
                <div 
                  className={`group relative flex flex-col sm:flex-row ${
                    isReversed ? 'sm:flex-row-reverse' : 'sm:flex-row'
                  } items-center gap-6 py-4 transition-all duration-500 hover:-translate-y-1 cursor-pointer w-full overflow-hidden`}
                >
                  {/* Image Block */}
                  <div className="w-full sm:w-[46%] aspect-[4/3] overflow-hidden rounded-[1.8rem] border border-white/10 relative bg-black/20 shrink-0 dept-image shadow-xl">
                    <img 
                      src={dept.img} 
                      alt={dept.title} 
                      className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-[800ms] ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    
                    {/* Badge */}
                    {dept.subtitle && (
                      <span className={`absolute top-4 ${isReversed ? 'left-4' : 'right-4'} bg-black/40 group-hover:bg-[#db011c] text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-lg transition-colors duration-300 backdrop-blur-md border border-white/10`}>
                        {dept.subtitle}
                      </span>
                    )}
                  </div>

                  {/* Text Block */}
                  <div className={`w-full flex flex-col justify-center text-left items-start ${
                    isReversed ? 'sm:pl-6' : 'sm:pr-6'
                  } transition-transform duration-500`}>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-3 group-hover:text-[#db011c] transition-colors duration-300 leading-tight dept-title">
                      {dept.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed font-light line-clamp-4 dept-desc">
                      {dept.desc}
                    </p>
                  </div>

                </div>
              </ScrollReveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
