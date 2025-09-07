import React, { useState, useRef } from 'react';
import type { LandingPageProps } from '@/types/pages/landing';
import { TRAINERS } from '@/constants/landing-data';
import TrainerCard from './TrainerCard';
import styles from '@/assets/css/trainers-section.module.css';

const TrainersSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simple hover handlers for marquee pause
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <section id="trainers" className={`py-24 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`text-center mb-12 lg:mb-16 ${styles.animateFadeIn}`}>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            Huấn luyện viên{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
              cá nhân
            </span>
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-2 px-4">
            Đội ngũ huấn luyện viên chuyên nghiệp với nhiều năm kinh nghiệm
          </p>
          <p className="text-sm text-slate-500 font-medium">
            Chọn huấn luyện viên phù hợp cho hành trình của bạn • Vuốt để xem thêm
          </p>
        </div>

        {/* Marquee Scroll Container */}
        <div className={styles.animateSlideUp} style={{ animationDelay: '400ms' }}>
          <div
            ref={scrollRef}
            className={`${styles.marqueeContainer} scroll-smooth`}
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className={`${styles.marqueeTrack} flex gap-6 ${isPaused ? styles.paused : ''}`}>
              {/* Triple the trainers for seamless infinite scroll */}
              {[...TRAINERS, ...TRAINERS, ...TRAINERS].map((trainer, index) => (
                <TrainerCard
                  key={`${trainer.name}-${index}`}
                  trainer={trainer}
                  index={index}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrainersSection;
