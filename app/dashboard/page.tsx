"use client";

import React, { useState, useEffect } from 'react';
import ClientLayout from '@/components/ClientLayout';
import Topbar from '@/components/studio/Topbar';
import { Key, Users, TrendingUp, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConsumptionCharts } from '@/components/dashboard/ConsumptionCharts';

export default function VibeCodingDashboard() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({ provider: 'openai', name: '', apiKey: '' });

  const fetchKeys = () => {
    fetch('/api/vault')
      .then(res => res.json())
      .then(data => {
        if (data.success) setKeys(data.keys || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.apiKey) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Key added to vault');
        setNewKey({ ...newKey, name: '', apiKey: '' });
        fetchKeys();
      } else {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vault?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Key deleted');
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ClientLayout>
      <Topbar />
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">OPO Orchestration Dashboard</h1>
          <p className="text-neutral-400">Manage your LLM credentials and monitor swarm consumption limits.</p>
        </div>

        {/* Vault Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Key size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Credential Vault</h2>
          </div>

          <div className="flex gap-4 mb-6 bg-black/40 p-4 rounded-lg border border-neutral-800">
            <select 
              value={newKey.provider}
              onChange={e => setNewKey({...newKey, provider: e.target.value})}
              className="bg-neutral-800 border-none text-white rounded px-3 outline-none"
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <input 
              type="text" 
              placeholder="Key Name (e.g. Prod OpenAI)" 
              value={newKey.name}
              onChange={e => setNewKey({...newKey, name: e.target.value})}
              className="bg-neutral-800 border-none text-white rounded px-3 py-2 flex-1 outline-none"
            />
            <input 
              type="password" 
              placeholder="sk-..." 
              value={newKey.apiKey}
              onChange={e => setNewKey({...newKey, apiKey: e.target.value})}
              className="bg-neutral-800 border-none text-white rounded px-3 py-2 flex-1 outline-none"
            />
            <button 
              onClick={handleAddKey}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Key
            </button>
          </div>

          <div className="space-y-2">
            {keys.length === 0 ? (
              <p className="text-neutral-500 italic text-sm">No keys in vault. Swarm agents won't be able to run.</p>
            ) : (
              keys.map(k => (
                <div key={k.id} className="flex items-center justify-between bg-neutral-800/50 p-3 rounded border border-neutral-700/50">
                  <div>
                    <div className="font-bold text-white">{k.name}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-widest mt-1">Provider: <span className="text-indigo-400">{k.provider}</span></div>
                  </div>
                  <button onClick={() => handleDelete(k.id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Charts */}
        <ConsumptionCharts />

      </div>
    </ClientLayout>
  );
}
