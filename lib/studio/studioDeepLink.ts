import { AGENT_TEMPLATES } from '@/lib/studio/agentTemplates';

export type StudioDeepLinkOpen = 'settings' | 'mesh';

export interface StudioDeepLinkParams {
  open?: StudioDeepLinkOpen | null;
  deploy?: string | null;
  guide?: boolean;
}

export const PENDING_DEPLOY_KEY = 'opo-pending-deploy';

export function parseStudioDeepLink(searchParams: URLSearchParams): StudioDeepLinkParams {
  const openRaw = searchParams.get('open');
  const open =
    openRaw === 'settings' || openRaw === 'mesh' ? openRaw : null;
  const deployRaw = searchParams.get('deploy');
  const deploy =
    deployRaw && AGENT_TEMPLATES.some((t) => t.id === deployRaw) ? deployRaw : null;
  const guide = searchParams.get('guide') === '1' || searchParams.get('guide') === 'true';
  return { open, deploy, guide };
}