import React, { useState } from 'react';
import { Play, Brain, Code2, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface RestExplorerProps {
  onAnalyze: (responseBody: any) => void;
}

export default function RestExplorer({ onAnalyze }: RestExplorerProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{key: string, value: string}[]>([{key: '', value: ''}]);
  const [body, setBody] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSend = async () => {
    if (!url) {
      toast.error('La URL es requerida');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    const formattedHeaders = headers.reduce((acc, h) => {
      if (h.key.trim() && h.value.trim()) {
        acc[h.key.trim()] = h.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    try {
      let parsedBody = undefined;
      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          parsedBody = body; // send as raw text if not JSON
        }
      }

      const res = await fetch('/api/studio/rest-explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          url,
          headers: formattedHeaders,
          body: parsedBody
        })
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data);
      } else {
        toast.error(data.error || 'Error ejecutando request');
      }
    } catch (err: any) {
      toast.error(`Network Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addHeader = () => setHeaders([...headers, {key: '', value: ''}]);
  const removeHeader = (index: number) => {
    const newH = [...headers];
    newH.splice(index, 1);
    if (newH.length === 0) newH.push({key: '', value: ''});
    setHeaders(newH);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center space-x-2">
        <select 
          value={method} 
          onChange={(e) => setMethod(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold w-24"
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/customers"
          className="flex-1 bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !url}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-semibold flex items-center space-x-2 transition-colors"
        >
          {isLoading ? <span className="animate-spin">⏳</span> : <Play className="w-4 h-4" />}
          <span>Send</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Request Panel */}
        <div className="flex flex-col space-y-3 bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Headers</div>
          <div className="space-y-2">
            {headers.map((h, i) => (
              <div key={i} className="flex space-x-2">
                <input 
                  type="text" placeholder="Key" value={h.key} 
                  onChange={(e) => { const n = [...headers]; n[i].key = e.target.value; setHeaders(n); }}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                />
                <input 
                  type="text" placeholder="Value" value={h.value} 
                  onChange={(e) => { const n = [...headers]; n[i].value = e.target.value; setHeaders(n); }}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                />
                <button onClick={() => removeHeader(i)} className="text-neutral-500 hover:text-red-400 px-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addHeader} className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 pt-1">
              <Plus className="w-3 h-3" /> <span>Add Header</span>
            </button>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 pt-2 border-t border-neutral-800">Body (JSON)</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={method === 'GET' || method === 'HEAD'}
            placeholder={method === 'GET' ? "Body disabled for GET requests" : "{\n  \"key\": \"value\"\n}"}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-blue-500 min-h-[150px] disabled:opacity-50"
          />
        </div>

        {/* Response Panel */}
        <div className="flex flex-col bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden relative">
          <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Response</div>
            {response && (
              <div className="flex items-center space-x-3 text-xs">
                <span className={response.status < 300 ? "text-emerald-400" : "text-red-400"}>
                  Status: {response.status} {response.statusText}
                </span>
                <span className="text-neutral-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" /> <span>{response.responseTimeMs}ms</span>
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-3 bg-[#0d0d0d]">
            {response ? (
              <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap">
                {typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                No response yet. Send a request.
              </div>
            )}
          </div>

          {response && typeof response.body === 'object' && (
            <div className="absolute bottom-4 right-4">
              <button 
                onClick={() => onAnalyze(response.body)}
                className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <Brain className="w-4 h-4" />
                <span>Analizar con Ollama</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
