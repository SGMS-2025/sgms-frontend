import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { ownerWorkflow } from '@/constants/ownerLanding';

const resolveIcon = (iconName: string): LucideIcon => {
  const IconComponent = Icons[iconName as keyof typeof Icons];

  if (typeof IconComponent === 'function') {
    return IconComponent as LucideIcon;
  }

  return Icons.Sparkles as LucideIcon;
};

const OwnerAutomationSection = () => {
  const { t } = useTranslation();

  return (
    <section
      id="owner-automation"
      className="bg-gradient-to-b from-white via-orange-50/60 to-white py-24 text-slate-900"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal className="space-y-6">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">
              {t('owner.automation.badge')}
            </span>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{t('owner.automation.title')}</h2>
            <p className="text-base text-slate-600">{t('owner.automation.subtitle')}</p>

            <div className="space-y-6">
              {ownerWorkflow.map((step, index) => {
                const IconComponent = resolveIcon(step.icon);

                return (
                  <ScrollReveal
                    key={step.title}
                    delay={index * 140}
                    className="flex gap-4 rounded-3xl border border-orange-100 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(249,115,22,0.45)]"
                  >
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-500">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">
                        {t('owner.automation.step')} {index + 1}
                      </p>
                      <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-sm text-slate-600">{step.description}</p>
                      <p className="text-sm font-medium text-emerald-600">{step.result}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal className="relative overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white p-8 shadow-[0_35px_80px_-40px_rgba(249,115,22,0.35)]">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-orange-300/25 blur-[120px]" />
            <div className="absolute -bottom-16 -left-16 size-60 rounded-full bg-amber-200/25 blur-[160px]" />

            <div className="relative space-y-6">
              <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
                <p className="text-xs uppercase tracking-widest text-orange-500">Customer Journey</p>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3">
                    <span className="font-medium text-slate-900">Đăng ký thử miễn phí</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">Tự động</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3">
                    <span className="font-medium text-slate-900">Chăm sóc & upsell</span>
                    <span className="text-xs text-orange-600">Workflow 5 bước</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3">
                    <span className="font-medium text-slate-900">Gia hạn & thanh toán</span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-600">1 cú click</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                  Cảnh báo theo thời gian thực
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex size-2 rounded-full bg-rose-400" />
                    <span>Chi nhánh Quận 7 đạt 65% KPI doanh thu tuần – đề xuất kích hoạt ưu đãi gói 3 tháng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex size-2 rounded-full bg-emerald-400" />
                    <span>Lịch làm việc HLV Duy: thêm 2 khung giờ trống phù hợp nhu cầu khách VIP.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex size-2 rounded-full bg-sky-400" />
                    <span>Camera check-in phát hiện hội viên chưa gia hạn. Gửi nhắc qua Zalo OA.</span>
                  </li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default OwnerAutomationSection;
