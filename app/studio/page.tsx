"use client";

import { useStudioStore } from '@/store/useStudioStore';
import StudioEditor from '@/components/studio/StudioEditor';
import Onboarding from '@/components/studio/Onboarding';
import { useEffect, useState } from 'react';

import { ReactFlowProvider } from '@xyflow/react';

export default function StudioPage() {
  const { project } = useStudioStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {project ? (
        <ReactFlowProvider>
          <StudioEditor />
        </ReactFlowProvider>
      ) : (
        <Onboarding />
      )}
    </>
  );
}
