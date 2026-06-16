'use client';

import { motion } from 'motion/react';
import { AGENT_TEMPLATES } from '@/lib/studio/agentTemplates';
import { useStudioStore } from '@/store/useStudioStore';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface AgentTemplateGalleryProps {
  compact?: boolean;
}

export default function AgentTemplateGallery({ compact = false }: AgentTemplateGalleryProps) {
  const deployAgentTemplate = useStudioStore((s) => s.deployAgentTemplate);

  const handleSelect = (templateId: string) => {
    const title = deployAgentTemplate(templateId);
    if (title) {
      toast.success(`"${title}" se unió a tu equipo en el lienzo.`);
    } else {
      toast.error('No se pudo crear el empleado virtual.');
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <p className="text-xs text-neutral-400">
            Elegí un rol y lo agregamos al lienzo con sus áreas de negocio conectadas.
          </p>
        </div>
      )}
      <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
        {AGENT_TEMPLATES.map((template, index) => (
          <motion.button
            key={template.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(template.id)}
            className={`
              group relative overflow-hidden rounded-xl border border-neutral-800/80
              bg-gradient-to-br ${template.gradient}
              backdrop-blur-md text-left transition-shadow
              hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10
              ${compact ? 'p-3' : 'p-4'}
            `}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="text-2xl shrink-0">{template.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <template.icon className="w-4 h-4 text-violet-300 shrink-0" />
                  <h4 className={`font-semibold text-neutral-100 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                    {template.title}
                  </h4>
                </div>
                <p className={`text-neutral-400 mt-1 leading-snug ${compact ? 'text-[11px] line-clamp-2' : 'text-xs'}`}>
                  {template.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}