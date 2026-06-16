import { Database, Zap, Play, Search, GripVertical, Bot, ShoppingCart, Brain, Wrench, Network } from 'lucide-react';
import { useState } from 'react';

const NODE_TYPES = [
  {
    category: 'AI Models & Agents',
    items: [
      { type: 'agentNode', label: 'AI Agent (Ollama)', description: 'Local LLM agent (configure model in right panel or per-node)', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'ollama' } },
      { type: 'agentNode', label: 'AI Agent (OpenAI)', description: 'GPT-class agent (set key in Settings)', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'openai' } },
      { type: 'agentNode', label: 'AI Agent (Anthropic)', description: 'Claude agent (set key in Settings)', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'anthropic' } },
    ]
  },
  {
    category: 'E-Commerce (examples)',
    items: [
      { type: 'triggerNode', label: 'Shopify Webhook', description: 'Stub - use Tool or Agent node for real integration', icon: ShoppingCart, color: 'text-emerald-400' },
      { type: 'actionNode', label: 'VTEX API', description: 'Stub - model as Tool + custom prompt', icon: ShoppingCart, color: 'text-emerald-400' },
      { type: 'actionNode', label: 'Magento', description: 'Stub - model as Tool + custom prompt', icon: ShoppingCart, color: 'text-emerald-400' },
    ]
  },
  {
    category: 'Databases & ERPs',
    items: [
      { type: 'entityNode', label: 'Protheus Table', description: 'Entidad de Totvs', icon: Database, color: 'text-blue-400' },
      { type: 'entityNode', label: 'PostgreSQL', description: 'Tabla SQL', icon: Database, color: 'text-blue-400' },
      { type: 'entityNode', label: 'MongoDB', description: 'Colección NoSQL', icon: Database, color: 'text-blue-400' },
    ]
  },
  {
    category: 'Cognitive Mesh',
    items: [
      { type: 'agentNode', label: 'AI Agent', description: 'Agente autónomo', icon: Brain, color: 'text-violet-400' },
      { type: 'toolNode', label: 'Tool / MCP', description: 'Herramienta o servidor MCP', icon: Wrench, color: 'text-amber-400' },
      { type: 'n8nNode', label: 'n8n Connector', description: 'Disparar automatizaciones en n8n', icon: Network, color: 'text-orange-405' },
    ]
  }
];

export default function SidebarLeft() {
  const [searchTerm, setSearchTerm] = useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, preset?: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    if (preset) {
      event.dataTransfer.setData('application/preset', JSON.stringify(preset));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-neutral-950 flex flex-col shrink-0 border-r border-neutral-800">
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-sm mb-3">Node Library</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neutral-600 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {NODE_TYPES.map((category) => {
          const filteredItems = category.items.filter(item => 
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={category.category}>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
                {category.category}
              </h4>
              <div className="space-y-2">
                {filteredItems.map((item, idx) => (
                  <div 
                    key={idx}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.label, (item as any).preset)}
                    className="flex items-start space-x-3 p-2 rounded-md hover:bg-neutral-900 cursor-grab active:cursor-grabbing border border-transparent hover:border-neutral-800 transition-all group"
                  >
                    <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-neutral-600" />
                    </div>
                    <div className={`p-1.5 rounded bg-neutral-900 border border-neutral-800 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-200">{item.label}</div>
                      <div className="text-xs text-neutral-500">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
