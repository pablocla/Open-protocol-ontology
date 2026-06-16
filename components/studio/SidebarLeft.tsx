import {
  Database,
  Search,
  GripVertical,
  Bot,
  ShoppingCart,
  Brain,
  Wrench,
  Network,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import AgentTemplateGallery from './AgentTemplateGallery';

const NODE_TYPES = [
  {
    category: 'Empleados (configuración avanzada)',
    items: [
      { type: 'agentNode', label: 'Empleado Virtual (Ollama)', description: 'IA local — configurá el modelo en Ajustes', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'ollama' } },
      { type: 'agentNode', label: 'Empleado Virtual (OpenAI)', description: 'GPT — requiere clave en Ajustes', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'openai' } },
      { type: 'agentNode', label: 'Empleado Virtual (Anthropic)', description: 'Claude — requiere clave en Ajustes', icon: Bot, color: 'text-indigo-400', preset: { llmProvider: 'anthropic' } },
    ],
  },
  {
    category: 'E-Commerce (ejemplos)',
    items: [
      { type: 'triggerNode', label: 'Shopify Webhook', description: 'Ejemplo — usar Habilidad o Empleado', icon: ShoppingCart, color: 'text-emerald-400' },
      { type: 'actionNode', label: 'VTEX API', description: 'Ejemplo — modelar como Habilidad', icon: ShoppingCart, color: 'text-emerald-400' },
      { type: 'actionNode', label: 'Magento', description: 'Ejemplo — modelar como Habilidad', icon: ShoppingCart, color: 'text-emerald-400' },
    ],
  },
  {
    category: 'Áreas de negocio (ERP)',
    items: [
      { type: 'entityNode', label: 'Tabla Protheus', description: 'Área de negocio TOTVS', icon: Database, color: 'text-blue-400' },
      { type: 'entityNode', label: 'PostgreSQL', description: 'Tabla de base de datos', icon: Database, color: 'text-blue-400' },
      { type: 'entityNode', label: 'MongoDB', description: 'Colección NoSQL', icon: Database, color: 'text-blue-400' },
    ],
  },
  {
    category: 'Equipo de trabajo',
    items: [
      { type: 'agentNode', label: 'Empleado Virtual', description: 'Agente autónomo de su equipo', icon: Brain, color: 'text-violet-400' },
      { type: 'toolNode', label: 'Habilidad / Integración', description: 'Conexión a API o servicio externo', icon: Wrench, color: 'text-amber-400' },
      { type: 'n8nNode', label: 'Automatización n8n', description: 'Disparar flujos en n8n', icon: Network, color: 'text-orange-400' },
    ],
  },
];

const EXPERT_ONLY_CATEGORIES = new Set(['E-Commerce (ejemplos)']);

export default function SidebarLeft() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expertOpen, setExpertOpen] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, preset?: Record<string, unknown>) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    if (preset) {
      event.dataTransfer.setData('application/preset', JSON.stringify(preset));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-neutral-950 flex flex-col shrink-0 border-r border-neutral-800">
      <div id="empleados-disponibles" className="p-4 border-b border-neutral-800 scroll-mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-sm text-neutral-100">🧑‍💼 Empleados Disponibles</h3>
        </div>
        <AgentTemplateGallery compact />
      </div>

      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-sm mb-3 text-neutral-300">Biblioteca técnica</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar componentes..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neutral-600 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {NODE_TYPES.map((category) => {
          const isExpertCategory = EXPERT_ONLY_CATEGORIES.has(category.category);
          if (isExpertCategory && !expertOpen && !searchTerm.trim()) return null;

          const filteredItems = category.items.filter(
            (item) =>
              item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={category.category}>
              {isExpertCategory ? (
                <button
                  type="button"
                  onClick={() => setExpertOpen((open) => !open)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2 hover:text-neutral-300 transition-colors"
                >
                  <span>{category.category}</span>
                  {expertOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
                  {category.category}
                </h4>
              )}
              {(expertOpen || searchTerm.trim() || !isExpertCategory) && (
                <div className="space-y-2">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type, item.label, (item as { preset?: Record<string, unknown> }).preset)}
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
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}