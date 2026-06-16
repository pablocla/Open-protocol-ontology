import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 focus-within:border-violet-500/50 transition-colors flex flex-wrap gap-1.5 min-h-[38px] items-center">
      {tags.map(tag => (
        <span 
          key={tag} 
          className="flex items-center space-x-1 bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded text-xs"
        >
          <span>{tag}</span>
          <button 
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-violet-500/30 rounded p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[60px] bg-transparent text-sm text-neutral-200 focus:outline-none px-1"
      />
    </div>
  );
}
