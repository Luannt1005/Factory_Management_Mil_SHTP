'use client';
import { useState } from 'react';
import Link from 'next/link';

const departments = [
  {
    id: 'hr',
    title: 'Human Resources',
    desc: 'Leading our talent acquisition and maintaining our core company values through people management.',
    img: '/hr_department.png',
    link: '/departments/hr'
  },
  {
    id: 'it',
    title: 'Information Technology',
    desc: 'Powering our infrastructure with cutting-edge technology and securing our digital footprint.',
    img: '/it_department.png',
    link: '/departments/it'
  },
  {
    id: 'production',
    title: 'Advanced Production',
    desc: 'The heart of our operations, delivering world-class manufacturing solutions with precision.',
    img: '/production_department.png',
    link: '/departments/production'
  },
  {
    id: 'facilities',
    title: 'Facilities & Safety',
    desc: 'Ensuring a safe, secure, and world-class environment for all employees and visitors.',
    img: '/home bg.png',
    link: '/departments/facilities'
  },
  {
      id: 'logistics',
      title: 'Global Logistics',
      desc: 'Optimizing our supply chain and distribution networks to deliver Milwaukee quality worldwide.',
      img: '/production_department.png',
      link: '/departments/logistics'
  }
];

export default function DepartmentSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === departments.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? departments.length - 1 : prev - 1));
  };

  return (
    <div className="slider-wrapper" style={{ 
        position: 'relative', 
        width: '100%', 
        padding: '3rem 0 5rem',
        overflow: 'hidden'
    }}>
      <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '600px',
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto'
      }}>
        {departments.map((dept, index) => {
            let position = index - currentIndex;
            
            // Seamless infinite wrapping logic
            if (position < -2) position += departments.length;
            if (position > 2) position -= departments.length;

            const isActive = position === 0;
            const isVisible = Math.abs(position) <= 1;
            
            // Stability values: removed "back" easing that caused shaking
            const offsetX = position * 380; 
            const scale = isActive ? 1 : 0.85; // Less dramatic scaling
            const opacity = isVisible ? 1 : 0;
            const zIndex = isActive ? 20 : 10;
            const brightness = isActive ? '100%' : '70%';

            return (
                <div 
                    key={dept.id}
                    style={{
                        position: 'absolute',
                        width: '400px',
                        height: '550px',
                        left: '50%',
                        marginLeft: '-200px', 
                        transform: `translateX(${offsetX}px) scale(${scale})`,
                        opacity: opacity,
                        zIndex: zIndex,
                        filter: `brightness(${brightness})`,
                        transition: 'all 0.5s ease-in-out', // Standard smooth easing to prevent "shaking"
                        background: 'white',
                        borderRadius: '24px',
                        boxShadow: isActive ? '0 40px 80px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        pointerEvents: isActive ? 'auto' : 'none',
                        border: isActive ? 'none' : '1px solid rgba(0,0,0,0.05)'
                    }}
                >
                    <div style={{ height: '280px', position: 'relative', overflow: 'hidden' }}>
                        <img 
                            src={dept.img} 
                            alt={dept.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        {/* Shadow overlay for inactive cards */}
                        {!isActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }}></div>}
                    </div>

                    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center', background: 'white' }}>
                        <h3 style={{ 
                            fontSize: '1.8rem', 
                            fontWeight: 800, 
                            marginBottom: '1rem', 
                            color: isActive ? '#db011c' : '#475569'
                        }}>{dept.title}</h3>
                        
                        <p style={{ 
                            fontSize: '1rem', 
                            color: '#64748b', 
                            marginBottom: '2rem', 
                            lineHeight: '1.5',
                            opacity: isActive ? 1 : 0.5,
                            transition: 'opacity 0.4s'
                        }}>{dept.desc}</p>
                        
                        <div style={{ marginTop: 'auto', opacity: isActive ? 1 : 0, transition: 'all 0.4s' }}>
                            <Link href={dept.link} style={{ 
                                padding: '0.8rem 2.5rem', 
                                background: '#db011c', 
                                color: 'white', 
                                borderRadius: '4px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-block'
                            }}>
                                EXPLORE DETAILS
                            </Link>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        style={{ 
          position: 'absolute', 
          left: '20px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 100, 
          background: 'white', 
          border: 'none', 
          color: '#db011c', 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      
      <button 
        onClick={nextSlide}
        style={{ 
          position: 'absolute', 
          right: '20px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 100, 
          background: 'white', 
          border: 'none', 
          color: '#db011c', 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Dots Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
        {departments.map((_, idx) => (
          <div 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{ 
              width: currentIndex === idx ? '32px' : '8px', height: '8px', 
              borderRadius: '4px', background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
}
