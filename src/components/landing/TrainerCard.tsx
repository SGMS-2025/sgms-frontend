import React from 'react';
import { Button } from '@/components/ui/button';
import type { Trainer } from '@/types/pages/landing';
import { getTrainerColorScheme } from '@/constants/landing-data';
import { renderCustomStars } from '@/utils/ratingHelpers';
import styles from '@/assets/css/trainers-section.module.css';

interface TrainerCardProps {
  trainer: Trainer;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const TrainerCard: React.FC<TrainerCardProps> = ({ trainer, index, onMouseEnter, onMouseLeave }) => {
  const colorScheme = getTrainerColorScheme(index);

  return (
    <div className="flex-shrink-0 w-80 snap-center">
      <div
        className={`${styles.cardPerspective} h-96 cursor-pointer select-none`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className={styles.card}>
          {/* Card Front */}
          <div className={`${styles.cardFront} ${colorScheme.front}`}>
            <div className="relative h-3/4 overflow-hidden rounded-t-2xl">
              <img
                src={trainer.image}
                alt={trainer.name}
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Bottom Info */}
            <div className="h-1/4 p-4 flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold text-slate-900 text-center mb-1">{trainer.name}</h3>
              <p className="text-sm text-slate-600 text-center">{trainer.specialty}</p>
            </div>
          </div>

          {/* Card Back */}
          <div className={styles.cardBack}>
            <div
              className={`w-full h-full bg-gradient-to-br ${colorScheme.back} rounded-2xl p-6 text-white flex flex-col justify-between`}
            >
              <div>
                <h3 className="text-2xl font-bold mb-4 text-center">{trainer.name}</h3>
                <div className="space-y-3 text-center">
                  <p className="text-sm opacity-90">{trainer.specialty}</p>
                  <p className="text-sm opacity-90">{trainer.experience}</p>
                  <div className="flex items-center justify-center gap-2 my-3">
                    <div className="flex items-center">{renderCustomStars(trainer.rating)}</div>
                    <span className="text-sm font-semibold">{trainer.rating}</span>
                  </div>
                  <p className="text-xl font-bold">{trainer.price}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="sm"
                  className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 font-semibold rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={(e) => e.stopPropagation()}
                >
                  Đăng ký ngay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-white text-slate-700 border-2 border-white hover:bg-slate-50 font-semibold rounded-xl py-3 transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem lịch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerCard;
