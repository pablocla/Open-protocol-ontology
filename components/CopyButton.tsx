'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Copy Button Component
 * Licensed under the Apache License, version 2.0
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 font-mono text-xxs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{label ? `${label} Copied!` : 'Copied!'}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>{label ? `Copy ${label}` : 'Copy'}</span>
        </>
      )}
    </button>
  );
}
