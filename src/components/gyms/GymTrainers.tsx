import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface Trainer {
  id: number;
  name: string;
  title: string;
  experience: string;
  specialties: string;
  rating: number;
  image: string;
}

interface GymTrainersProps {
  trainers: Trainer[];
}

export const GymTrainers: React.FC<GymTrainersProps> = ({ trainers }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gym-orange mb-6">HUẤN LUYỆN VIÊN</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img src={trainer.image} alt={trainer.name} className="w-full h-48 object-cover" />
                <Badge className="absolute top-2 right-2 bg-gym-orange text-white">Gym</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gym-navy mb-1">{trainer.name}</h3>
                <p className="text-sm text-gym-gray mb-2">{trainer.title}</p>
                <p className="text-sm text-gym-gray mb-3">{trainer.experience}</p>
                <p className="text-xs text-gym-gray mb-4 leading-relaxed">{trainer.specialties}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Đánh giá:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(trainer.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm font-medium ml-1">{trainer.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-gym-orange hover:bg-gym-orange/90 text-white">
                    Đăng ký
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    Xem lịch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
