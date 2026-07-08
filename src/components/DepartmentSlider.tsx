'use client';
import ScrollReveal from '@/components/ScrollReveal';
import Image from 'next/image';

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
      {/* Removed style block for scroll performance */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full">
        {departments.map((dept, idx) => {
          // Stagger delays based on column index
          const delay = (idx % 2) * 100;
          // Row-by-row alternating checkerboard logic (alternates every 2 departments)
          const isReversed = Math.floor(idx / 2) % 2 === 1;

          return (
            <div key={dept.id} className="w-full h-[300px] md:h-[400px] lg:h-[500px] relative group overflow-hidden border-b md:border-b-0 border-white/10">
              <ScrollReveal delay={delay} className="w-full h-full">
                <div className="w-full h-full relative cursor-pointer">
                  {/* Background Image */}
                  <Image 
                    src={dept.img} 
                    alt={dept.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={idx < 2}
                    className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out" 
                  />
                  {/* Dark Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  {/* Text Content positioned at left center/bottom */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 lg:p-16">
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-3 lg:mb-4 group-hover:text-gray-200 transition-colors duration-300 drop-shadow-md">
                      {dept.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/90 leading-relaxed font-normal max-w-lg drop-shadow">
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
