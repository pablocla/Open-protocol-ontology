import React, { useEffect, useRef, useState } from 'react';
import { 
  Plus, Trash2, Brain, Database, Network, Wrench, Play, 
  CheckSquare, ChevronRight, FileText, User, Users, CreditCard, Globe
} from 'lucide-react';
import { Node } from '@xyflow/react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  panePosition: { x: number; y: number };
  node: Node | null;
  onClose: () => void;
  onAddNode: (type: string, label: string, position: { x: number; y: number }, extraData?: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onValidateNode: (node: Node | null) => void;
  onAutoDiscover: () => void;
  onParametrize: (node: Node | null) => void;
}

export default function ContextMenu({
  isOpen,
  position,
  panePosition,
  node,
  onClose,
  onAddNode,
  onDeleteNode,
  onValidateNode,
  onAutoDiscover,
  onParametrize
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showEntitiesSubmenu, setShowEntitiesSubmenu] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddNode = (type: string, label: string, extraData?: any) => {
    onAddNode(type, label, panePosition, extraData);
    onClose();
  };

  const handleDelete = () => {
    if (node) {
      onDeleteNode(node.id);
    }
    onClose();
  };

  const tier1Entities = [
    { label: 'Invoice', icon: FileText, attributes: [{ id: '1', name: 'id', type: 'String' }, { id: '2', name: 'grandTotal', type: 'Float' }, { id: '3', name: 'customerId', type: 'String' }] },
    { label: 'Customer', icon: User, attributes: [{ id: '1', name: 'id', type: 'String' }, { id: '2', name: 'name', type: 'String' }, { id: '3', name: 'taxId', type: 'String' }] },
    { label: 'Supplier', icon: Users, attributes: [{ id: '1', name: 'id', type: 'String' }, { id: '2', name: 'companyName', type: 'String' }, { id: '3', name: 'taxId', type: 'String' }] },
    { label: 'Payment', icon: CreditCard, attributes: [{ id: '1', name: 'id', type: 'String' }, { id: '2', name: 'amount', type: 'Float' }, { id: '3', name: 'paymentDate', type: 'DateTime' }] },
  ];

  const handleActionAlert = (actionName: string) => {
    alert(`[OCP Engine] Iniciando acción: ${actionName} en ${node ? node.data.label : 'Canvas'}`);
    onClose();
  };

  const handleValidate = () => {
    onValidateNode(node);
    onClose();
  };

  const handleParametrize = () => {
    onParametrize(node);
    onClose();
  };

  const handleAutoDiscover = () => {
    onAutoDiscover();
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="absolute z-50 min-w-[200px] glass-panel rounded-lg p-1.5 text-xs text-neutral-300 font-mono select-none"
    >
      {node ? (
        // NODE CONTEXT MENU
        <div className="space-y-0.5">
          <div className="px-2.5 py-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-900 mb-1">
            Node: {String(node.data.label || node.type)}
          </div>
          
          <button
            onClick={handleValidate}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verificar Datos Ontológicos</span>
          </button>

          <button
            onClick={handleParametrize}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Parametrizar API/Tabla</span>
          </button>

          {node.type === 'agentNode' && (
            <button
              onClick={() => handleActionAlert('Inspeccionar Memoria Común')}
              className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
            >
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span>Inspeccionar Memoria Swarm</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-rose-950/45 hover:text-rose-400 rounded text-left transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Node</span>
          </button>
        </div>
      ) : (
        // PANE (CANVAS) CONTEXT MENU
        <div className="space-y-0.5 relative">
          <div className="px-2.5 py-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-900 mb-1">
            Canvas Options
          </div>

          {/* Add OPO Entity (With Submenu) */}
          <div 
            onMouseEnter={() => setShowEntitiesSubmenu(true)}
            onMouseLeave={() => setShowEntitiesSubmenu(false)}
            className="relative"
          >
            <button
              className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Add OPO Entity</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            </button>

            {/* SUBMENU */}
            {showEntitiesSubmenu && (
              <div className="absolute top-0 left-[195px] min-w-[160px] glass-panel rounded-lg p-1 space-y-0.5">
                {tier1Entities.map((entity) => (
                  <button
                    key={entity.label}
                    onClick={() => handleAddNode('entityNode', entity.label, { attributes: entity.attributes })}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-neutral-900 rounded text-left transition-colors"
                  >
                    <entity.icon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{entity.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleAddNode('agentNode', 'AI Swarm Agent')}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>Add Swarm Node (Agent)</span>
          </button>

          <button
            onClick={() => handleAddNode('n8nNode', 'n8n Connector')}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-orange-400" />
            <span>Add n8n Connector</span>
          </button>

          <button
            onClick={() => handleAddNode('toolNode', 'Tool / MCP')}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Tool / MCP</span>
          </button>

          <button
            onClick={() => handleActionAlert('Inspeccionar Memoria Común (Global)')}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>Inspect Common Memory</span>
          </button>

          <div className="border-t border-neutral-900 my-1"></div>

          <button
            onClick={handleAutoDiscover}
            className="w-full flex items-center space-x-2 px-2.5 py-2 hover:bg-neutral-900 rounded text-left transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Discover (SQL / REST)</span>
          </button>
        </div>
      )}
    </div>
  );
}
