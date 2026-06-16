"use client";

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ConsumptionReport } from '@/lib/engine/types/credentials';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ConsumptionCharts() {
  const [data, setData] = useState<ConsumptionReport | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.report) {
          setData(res.report);
        }
      })
      .catch(console.error);
  }, []);

  if (!data) return <div className="text-neutral-400 p-8 text-center animate-pulse">Loading consumption metrics...</div>;

  const agentData = Object.entries(data.agents).map(([id, info]) => ({
    name: id,
    Tokens: info.tokensUsed,
    Requests: info.requestCount
  }));

  const keyData = Object.entries(data.keys).map(([id, info]) => ({
    name: `${info.provider} (${id.slice(-4)})`,
    value: info.tokensUsed
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Tokens per Agent</h3>
        <div className="h-64">
          {agentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData}>
                <XAxis dataKey="name" stroke="#525252" fontSize={12} />
                <YAxis stroke="#525252" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#a3a3a3' }}
                />
                <Legend />
                <Bar dataKey="Tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-500 italic">No agent data yet</div>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Usage by Provider Key</h3>
        <div className="h-64">
          {keyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={keyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {keyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-neutral-500 italic">No key data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
