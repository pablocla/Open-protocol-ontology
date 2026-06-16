import { CheckCircle2, Loader2, Circle, ArrowRight } from 'lucide-react';

export type AgentStatus = 'pending' | 'active' | 'done' | 'error';

interface PipelineStep {
  agentId: string;
  status: AgentStatus;
}

export default function PipelineStatusBar({ steps }: { steps: PipelineStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="flex items-center space-x-1 px-4 py-2.5 bg-neutral-900/50 border-b border-neutral-800 overflow-x-auto shrink-0">
      {steps.map((step, i) => (
        <div key={step.agentId} className="flex items-center shrink-0">
          <div className={`
            flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all
            ${step.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ''}
            ${step.status === 'active' ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse' : ''}
            ${step.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : ''}
            ${step.status === 'pending' ? 'bg-neutral-900 text-neutral-500 border-neutral-800' : ''}
          `}>
            {step.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
            {step.status === 'active' && <Loader2 className="w-3 h-3 animate-spin" />}
            {step.status === 'error' && <Circle className="w-3 h-3 text-red-400" />}
            {step.status === 'pending' && <Circle className="w-3 h-3" />}
            <span>{step.agentId}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-3 h-3 text-neutral-700 mx-1 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
