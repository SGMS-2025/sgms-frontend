import { useState, useEffect } from 'react';
import { X, MessageSquareText, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FloatingContactPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay để trigger animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    // Delay để animation hoàn thành trước khi đóng
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    handleClose();

    // Show success message (you can replace this with actual form submission)
    alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ trong vòng 24h.');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_8px_32px_rgba(249,115,22,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_rgba(249,115,22,0.6)] focus:outline-none focus:ring-4 focus:ring-orange-300 floating-button-pulse"
        aria-label="Mở form liên hệ"
      >
        <MessageSquareText className="h-6 w-6" />
      </button>

      {/* Popup Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
            isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
          }`}
        >
          {/* Backdrop click handler */}
          <button className="absolute inset-0 w-full h-full" onClick={handleClose} aria-label="Đóng popup" />
          <div
            className={`relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 transform ${
              isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 hover:scale-110"
              aria-label="Đóng popup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 id="popup-title" className="text-xl font-semibold text-slate-900">
                Đặt lịch tư vấn
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Chúng tôi sẽ liên hệ trong vòng 24h để chuẩn bị demo dựa trên mô hình phòng gym của bạn.
              </p>
            </div>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-3">
                <Phone className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Hotline chiến lược</p>
                  <p className="text-sm font-semibold text-orange-600">1900 6868 (24/7)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-3">
                <Mail className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Email tư vấn</p>
                  <p className="text-sm font-semibold text-orange-600">hello@gymsmart.vn</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Họ và tên" className="h-12 rounded-xl border-slate-200" required />
              <Input placeholder="Email công việc" type="email" className="h-12 rounded-xl border-slate-200" required />
              <Input placeholder="Số điện thoại" className="h-12 rounded-xl border-slate-200" required />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Đang gửi...'
                ) : (
                  <>
                    Gửi yêu cầu tư vấn
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Bằng việc gửi form bạn đồng ý với{' '}
                <a href="/privacy-policy" className="text-orange-600 hover:underline">
                  điều khoản bảo mật dữ liệu
                </a>{' '}
                của GymSmart.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingContactPopup;
