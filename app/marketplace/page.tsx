"use client";

import React, { useState, useEffect } from 'react';
import ClientLayout from '@/components/ClientLayout';
import { toast } from 'sonner';

export default function MarketplacePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/marketplace/publish')
      .then(r => r.json())
      .then(d => {
        if (d.success) setEmployees(d.digitalEmployees || []);
      });
  }, []);

  const showEndpoint = (emp: any) => {
    const curl = `curl -X POST https://your-opo-domain.com/api/v1/run/${emp.id} \\
  -H "X-OPO-Key: YOUR_OPO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Your input here",
    "context": {}
  }'`;
    setSelected({ ...emp, curl });
  };

  return (
    <ClientLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tighter">OPO Marketplace</h1>
          <p className="text-xl text-neutral-400 mt-2">Discover ready-to-use DigitalEmployees. One click → one API endpoint.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length === 0 && (
            <div className="col-span-full text-center text-neutral-500 py-12">No DigitalEmployees published yet. Use "Publish to Marketplace" from OPO Studio.</div>
          )}
          {employees.map((emp: any) => (
            <div key={emp.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-emerald-600/50 transition-all">
              <div className="font-semibold text-lg mb-1">{emp.name}</div>
              <div className="text-sm text-neutral-400 line-clamp-3 mb-4">{emp.description}</div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500">Cost per execution</div>
                  <div className="text-2xl font-mono text-emerald-400">${emp.pricePerExecution || 0.05}</div>
                </div>
                <button 
                  onClick={() => showEndpoint(emp)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-sm px-5 py-2 rounded-xl font-medium"
                >
                  Get API Endpoint
                </button>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-2">Headless Endpoint for {selected.name}</h3>
              <p className="text-sm text-neutral-400 mb-4">Use this URL + your OPO_API_KEY from the Dashboard.</p>
              
              <pre className="bg-black p-4 rounded text-xs overflow-auto mb-4 text-emerald-300">{selected.curl}</pre>
              
              <div className="text-xs text-neutral-500">Endpoint: <code className="text-white">/api/v1/run/{selected.id}</code></div>
              <button onClick={() => setSelected(null)} className="mt-6 text-sm">Close</button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
