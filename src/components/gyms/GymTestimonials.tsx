import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Image as ImageIcon, User, Loader2, ArrowLeft } from 'lucide-react';
import { testimonialApi } from '@/services/api/testimonialApi';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import type { Testimonial } from '@/types/api/Testimonial';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface GymTestimonialsProps {
  branchId: string;
}

const TestimonialDetailView: React.FC<{ testimonial: Testimonial; onBack: () => void }> = ({ testimonial, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Article Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{testimonial.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(testimonial.createdAt), 'dd/MM/yyyy', { locale: vi })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="prose prose-orange max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-orange-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700">
            <MarkdownRenderer content={testimonial.content} />
          </div>

          {/* Images */}
          {testimonial.images && testimonial.images.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t('testimonial_modal.photos')} ({testimonial.images.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonial.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`${t('dashboard.testimonials')} ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GymTestimonials: React.FC<GymTestimonialsProps> = ({ branchId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const testimonialId = searchParams.get('testimonial');

  useEffect(() => {
    const fetchTestimonials = async () => {
      if (!branchId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await testimonialApi.getPublicTestimonialsByBranch(branchId, {
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        if (response.success) {
          setTestimonials(response.data);
        } else {
          setError('Failed to load testimonials');
        }
      } catch (err) {
        setError('Failed to load testimonials');
        console.error('Error fetching testimonials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [branchId]);

  // Fetch testimonial detail when testimonialId changes
  useEffect(() => {
    const fetchTestimonialDetail = async () => {
      if (!testimonialId) {
        setSelectedTestimonial(null);
        return;
      }

      setLoadingDetail(true);
      try {
        const response = await testimonialApi.getPublicTestimonialById(testimonialId);
        if (response.success) {
          setSelectedTestimonial(response.data);
        } else {
          setError('Failed to load testimonial detail');
          setSelectedTestimonial(null);
        }
      } catch (err) {
        setError('Failed to load testimonial detail');
        setSelectedTestimonial(null);
        console.error('Error fetching testimonial detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchTestimonialDetail();
  }, [testimonialId]);

  const handleTestimonialClick = (testimonial: Testimonial) => {
    setSearchParams({ testimonial: testimonial._id });
    // Scroll to top of the reviews section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSearchParams({});
    setSelectedTestimonial(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Show detail view if testimonial is selected
  if (testimonialId && selectedTestimonial) {
    if (loadingDetail) {
      return (
        <section>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        </section>
      );
    }

    return (
      <section>
        <TestimonialDetailView testimonial={selectedTestimonial} onBack={handleBackToList} />
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gym-orange mb-6">TESTIMONIALS</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có testimonials nào cho phòng tập này.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gym-orange mb-6">TESTIMONIALS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => {
          const thumbnailImage = testimonial.images && testimonial.images.length > 0 ? testimonial.images[0].url : null;

          return (
            <div
              key={testimonial._id}
              onClick={() => handleTestimonialClick(testimonial)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
            >
              {/* Thumbnail */}
              {thumbnailImage ? (
                <div className="relative h-48 w-full">
                  <img
                    src={thumbnailImage}
                    alt={testimonial.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-orange-400" />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Category Tag - Using status as category */}
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-50 rounded">
                    TESTIMONIAL
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{testimonial.title}</h3>

                {/* Date */}
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(testimonial.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
