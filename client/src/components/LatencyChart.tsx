import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LatencyTrendPoint } from '../types';

interface LatencyChartProps {
  data: LatencyTrendPoint[];
  title?: string;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({
  data,
  title = 'System Latency Trend (24h)',
}) => {
  if (!data || !data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
        No latency metric telemetry collected yet.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-200">{title}</h4>
        <span className="text-xs text-slate-400">Response Latency (ms)</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(val) => val.split(' ')[1] || val}
            />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="avgResponseTimeMs"
              name="Avg Response Time"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#latencyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
