import { EntityAttribute, FieldType } from '@/lib/studio/studioTypes';
import { Trash2, Key, Asterisk, Fingerprint } from 'lucide-react';

interface Props {
  attribute: EntityAttribute;
  onChange: (attrId: string, partial: Partial<EntityAttribute>) => void;
  onRemove: (attrId: string) => void;
}

const FIELD_TYPES: FieldType[] = ['String', 'Int', 'Float', 'Boolean', 'DateTime'];

export default function AttributeRow({ attribute, onChange, onRemove }: Props) {
  return (
    <div className="flex flex-col space-y-2 p-3 bg-neutral-900 border border-neutral-800 rounded-lg group">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={attribute.name}
          onChange={(e) => onChange(attribute.id, { name: e.target.value })}
          placeholder="Field name"
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
        
        <select
          value={attribute.type}
          onChange={(e) => onChange(attribute.id, { type: e.target.value as FieldType })}
          className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
        >
          {FIELD_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        
        <button
          onClick={() => onRemove(attribute.id)}
          className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
          title="Remove field"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={() => onChange(attribute.id, { isPrimaryKey: !attribute.isPrimaryKey })}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
            attribute.isPrimaryKey 
              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
              : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
          }`}
          title="Primary Key"
        >
          <Key className="w-3 h-3" />
          <span>PK</span>
        </button>

        <button
          onClick={() => onChange(attribute.id, { isRequired: !attribute.isRequired })}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
            attribute.isRequired 
              ? 'bg-red-500/10 text-red-400 border-red-500/30' 
              : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
          }`}
          title="Required"
        >
          <Asterisk className="w-3 h-3" />
          <span>Req</span>
        </button>

        <button
          onClick={() => onChange(attribute.id, { isUnique: !attribute.isUnique })}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
            attribute.isUnique 
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
              : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
          }`}
          title="Unique"
        >
          <Fingerprint className="w-3 h-3" />
          <span>Unq</span>
        </button>
      </div>
    </div>
  );
}
