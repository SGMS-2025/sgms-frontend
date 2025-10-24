import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Calendar, CreditCard } from 'lucide-react';

type PlanStatus = 'Active' | 'Paused' | 'Expired' | 'Pending';

export type CurrentPlan = {
  name: string;
  memberId: string;
  status: PlanStatus;
  validUntil: string;
  nextBillingDate?: string;
  price?: string;
  billingCycle?: 'Monthly' | 'Quarterly' | 'Yearly';
  remainingSessions?: number;
  ptSessionsPerMonth?: number;
  branchAccess?: 'Home Branch' | 'All Branches';
  benefits?: string[];
};

type Payment = {
  date: string;
  amount: string;
  status: 'Paid' | 'Failed' | 'Pending';
  note?: string;
};

export default function CustomerMembership({
  plan = {
    name: 'Premium Plus',
    memberId: 'FH-2024-001234',
    status: 'Active',
    validUntil: 'Dec 31, 2024',
    nextBillingDate: 'Nov 01, 2024',
    price: '$99.99',
    billingCycle: 'Monthly',
    remainingSessions: 4,
    ptSessionsPerMonth: 2,
    branchAccess: 'All Branches',
    benefits: [
      'Unlimited gym access',
      'All group classes included',
      '2 personal training sessions/month',
      'Access to all branches'
    ]
  },
  payments = [
    { date: 'Oct 1, 2024', amount: '$99.99', status: 'Paid' as const, note: 'Monthly Membership' },
    { date: 'Sep 1, 2024', amount: '$99.99', status: 'Paid' as const, note: 'Monthly Membership' },
    { date: 'Aug 1, 2024', amount: '$99.99', status: 'Paid' as const, note: 'Monthly Membership' }
  ]
}: {
  plan?: CurrentPlan;
  payments?: Payment[];
}) {
  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Membership</h1>
        <p className="text-gray-600 mt-2">Manage your membership and view payment history</p>
      </div>

      {/* Membership Card */}
      <MembershipCard plan={plan} />

      {/* Payment History */}
      <PaymentHistoryCard payments={payments} />
    </div>
  );
}

function MembershipCard({ plan }: { plan: CurrentPlan }) {
  const statusColor =
    plan.status === 'Active'
      ? 'bg-green-100 text-green-700'
      : plan.status === 'Paused'
        ? 'bg-amber-100 text-amber-700'
        : plan.status === 'Pending'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-red-100 text-red-700';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Membership Card
        </CardTitle>
        <CardDescription>Your active membership details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Member Card - Gradient Design như trong hình */}
        <div className="rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 p-4 sm:p-6 text-white">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">{plan.name}</h3>
            </div>
            <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>

          <div className="mb-4">
            <p className="text-sm opacity-80">Member ID</p>
            <p className="text-lg sm:text-xl font-bold tracking-wider">{plan.memberId}</p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-80">Valid Until</p>
              <p className="text-base sm:text-lg font-semibold">{plan.validUntil}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Status</p>
              <Badge className={`${statusColor} border-0`}>{plan.status}</Badge>
            </div>
          </div>
        </div>

        {/* Membership Benefits */}
        <div>
          <h4 className="mb-3 text-lg font-semibold text-gray-900">Membership Benefits</h4>
          <div className="space-y-2">
            {plan.benefits?.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600">Renew Membership</Button>
          <Button variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentHistoryCard({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>Your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">{payment.date}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{payment.note || 'Monthly Membership'}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-base sm:text-lg font-bold text-gray-900">{payment.amount}</p>
                <Badge
                  className={
                    payment.status === 'Paid'
                      ? 'bg-green-100 text-green-700 border-0'
                      : payment.status === 'Failed'
                        ? 'bg-red-100 text-red-700 border-0'
                        : 'bg-yellow-100 text-yellow-700 border-0'
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
