"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore, NodeMessage } from '@/store/useStudioStore';
import { Send, Trash2, Bot, User } from 'lucide-react';

interface NodeChatInterfaceProps {
  nodeId: string;
  systemPrompt: string;
  llmProvider?: string;
  llmModel?: string;
  baseUrl?: string; // for Ollama
  // Optional for floating mosaic panels (future or GraphCanvas usage) - #2 fix
  onClose?: () => void;
  defaultPosition?: { x: number; y: number };
}

export default function NodeChatInterface({
  nodeId,
  systemPrompt,
  llmProvider = 'ollama',
  llmModel = 'llama3.1',
  baseUrl = 'http://localhost:11434',
  onClose,
  defaultPosition
}: NodeChatInterfaceProps) {
  const { nodeChats, addNodeMessage, clearNodeChat } = useStudioStore();
  const messages = nodeChats[nodeId] || [];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: NodeMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    addNodeMessage(nodeId, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // GROK FIX #1: send real apiKeys + llmConfigs + currentProvider from store so cloud providers (gemini etc) receive keys in mosaic node chats
      const store = useStudioStore.getState();
      const response = await fetch('/api/studio/node-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          messages: [...messages, userMessage],
          systemPrompt,
          model: llmModel,
          baseUrl: llmProvider === 'ollama' || llmProvider === 'open-code' ? baseUrl : undefined,
          llmProvider,
          apiKeys: store.apiKeys,
          llmConfigs: store.llmConfigs,
          currentProvider: store.currentProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let assistantContent = '';
      const assistantId = `msg-${Date.now()}-assistant`;
      const assistantMessage: NodeMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      // Add placeholder for streaming / final
      addNodeMessage(nodeId, assistantMessage);

      if (contentType.includes('stream') || contentType.includes('event-stream')) {
        // Ollama NDJSON stream path
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  assistantContent += parsed.message.content;
                  // Progressive update without clearing (avoids flicker/loss)
                  const current = useStudioStore.getState().nodeChats[nodeId] || [];
                  const updatedChats = current.map(m =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  );
                  // Direct state patch for live typing
                  useStudioStore.setState((s) => ({
                    nodeChats: { ...s.nodeChats, [nodeId]: updatedChats }
                  }));
                }
              } catch (e) {
                // Ignore non-JSON NDJSON framing lines
              }
            }
          }
        }
      } else {
        // Cloud path returns JSON { message: {...}, done: true }
        const json = await response.json();
        if (json.message?.content) {
          assistantContent = json.message.content;
          const current = useStudioStore.getState().nodeChats[nodeId] || [];
          const updatedChats = current.map(m =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          );
          useStudioStore.setState((s) => ({
            nodeChats: { ...s.nodeChats, [nodeId]: updatedChats }
          }));
        }
      }

      // Ensure final non-empty (the progressive updates should have it)
      if (!assistantContent) {
        // Fallback: re-fetch last or leave placeholder (will be empty)
      }

    } catch (error: any) {
      const errorMsg: NodeMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Error: ${error.message || 'Failed to get response from provider.'}`,
      };
      addNodeMessage(nodeId, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    clearNodeChat(nodeId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // If rendered as floating mosaic (onClose or defaultPosition provided), wrap in positioned panel
  const isFloating = !!onClose || !!defaultPosition;
  const floatStyle: React.CSSProperties | undefined = isFloating && defaultPosition ? {
    position: 'absolute',
    left: defaultPosition.x,
    top: defaultPosition.y,
    zIndex: 60,
    width: 320,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
  } : undefined;

  const chatContent = (
    <div className={`mt-2 border-t border-neutral-700 pt-2 flex flex-col ${isFloating ? 'h-[220px] bg-neutral-900 rounded-lg border border-neutral-600' : 'h-[180px] bg-neutral-950 rounded-b'} text-xs`}>
      <div className="flex justify-between items-center px-2 pb-1">
        <div className="flex items-center gap-1 text-neutral-400">
          <Bot size={12} /> Agent Chat (isolated)
          {isFloating && <span className="text-[9px] ml-1 opacity-60">(floating)</span>}
        </div>
        <div className="flex items-center gap-1">
          {isFloating && onClose && (
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-0.5" title="Close mosaic panel">✕</button>
          )}
          <button onClick={handleClear} className="text-red-400 hover:text-red-300 p-0.5" title="Clear chat">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar text-[10px]">
        {messages.length === 0 && (
          <div className="text-neutral-500 italic p-1">Chat with this agent to configure it or test tasks. Responses are isolated to this node.</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-1 rounded ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-200' : msg.role === 'assistant' ? 'bg-violet-600/20 text-violet-200' : 'bg-neutral-800 text-neutral-400'}`}
          >
            <div className="flex items-start gap-1">
              {msg.role === 'user' ? <User size={10} className="mt-0.5 shrink-0" /> : <Bot size={10} className="mt-0.5 shrink-0" />}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-neutral-400 italic p-1 flex items-center gap-1">
            <Bot size={10} /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-1 border-t border-neutral-700 flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell the agent how to configure itself or give it a task..."
          disabled={isLoading}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-700 p-1 rounded text-white"
          title="Send to this agent only"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );

  if (isFloating) {
    return (
      <div style={floatStyle} className="bg-neutral-950 border border-neutral-700 rounded-lg overflow-hidden">
        {chatContent}
      </div>
    );
  }
  return chatContent;
}
