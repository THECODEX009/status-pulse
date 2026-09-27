import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Subscription } from '../types';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CreditCard, ShieldCheck, Zap, Building, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data, refetch } = useQuery<{ subscription: Subscription }>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data;
    },
  });

  const subscription = data?.subscription;

  const handleCheckout = async (plan: 'PRO' | 'ENTERPRISE') => {
    setLoadingPlan(plan);
    try {
      const res = await api.post('/subscriptions/checkout', { plan });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate Stripe checkout session');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Organization & Subscriptions</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your SaaS plan, billing, and team permissions.
        </p>
      </div>

      {/* Organization Details Card */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-slate-800 rounded-xl text-sky-400">
            <Building size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{user?.organizationName}</h3>
            <p className="text-xs text-slate-400">Public Status Page Slug: /status/{user?.organizationSlug}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Your Role</span>
            <span className="text-slate-200 font-bold">{user?.role}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Current SaaS Plan</span>
            <span className="text-sky-400 font-bold uppercase">{subscription?.plan || 'FREE'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Subscription Status</span>
            <span className="text-emerald-400 font-bold uppercase">{subscription?.status || 'active'}</span>
          </div>
        </div>
      </Card>

      {/* Subscription Pricing Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-sky-400" />
          <h3 className="text-base font-bold text-slate-100">Upgrade Enterprise Plan (Stripe SDK)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE Plan */}
          <Card className="flex flex-col justify-between border-slate-800">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-200">Free Tier</h4>
                {subscription?.plan === 'FREE' && <Badge label="Current Plan" status="OPERATIONAL" />}
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-3">$0</div>
              <p className="text-xs text-slate-400 mt-1">For side projects and small teams</p>

              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> 60-second health check pings
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> Up to 5 monitored services
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> Standard Public Status Page
                </li>
              </ul>
            </div>

            <Button className="w-full mt-6" variant="ghost" disabled>
              Default Plan
            </Button>
          </Card>

          {/* PRO Plan */}
          <Card className="flex flex-col justify-between border-sky-500/40 bg-sky-950/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
              Popular
            </div>
            <div>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-100">Pro Tier</h4>
                {subscription?.plan === 'PRO' && <Badge label="Current Plan" status="OPERATIONAL" />}
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-3">
                $29 <span className="text-xs text-slate-400 font-normal">/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">For growing SaaS products & API platforms</p>

              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> 30-second rapid health checks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> Up to 25 monitored services
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> Live WebSocket updates
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-sky-400" /> MTTR Analytics & Export
                </li>
              </ul>
            </div>

            <Button
              className="w-full mt-6"
              isLoading={loadingPlan === 'PRO'}
              disabled={subscription?.plan === 'PRO' || user?.role !== 'Admin'}
              onClick={() => handleCheckout('PRO')}
            >
              {subscription?.plan === 'PRO' ? 'Active Plan' : 'Upgrade to Pro'}
            </Button>
          </Card>

          {/* ENTERPRISE Plan */}
          <Card className="flex flex-col justify-between border-indigo-500/40 bg-indigo-950/10">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-100">Enterprise Tier</h4>
                {subscription?.plan === 'ENTERPRISE' && <Badge label="Current Plan" status="OPERATIONAL" />}
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-3">
                $99 <span className="text-xs text-slate-400 font-normal">/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">For mission-critical enterprise applications</p>

              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> 10-second ultra-fast checks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Unlimited monitored services
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Custom Status Page domain
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400" /> Dedicated BullMQ Redis Queues
                </li>
              </ul>
            </div>

            <Button
              className="w-full mt-6"
              variant="secondary"
              isLoading={loadingPlan === 'ENTERPRISE'}
              disabled={subscription?.plan === 'ENTERPRISE' || user?.role !== 'Admin'}
              onClick={() => handleCheckout('ENTERPRISE')}
            >
              {subscription?.plan === 'ENTERPRISE' ? 'Active Plan' : 'Upgrade to Enterprise'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
