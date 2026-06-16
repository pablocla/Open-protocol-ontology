'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Embedded Docusaurus Documentation Subpage
 * Licensed under the Apache License, version 2.0
 */

import React from 'react';

export default function EmbeddedDocsPage() {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3002';

  return (
    <div className="w-full h-full min-h-[calc(100vh-6.5rem)] flex flex-col bg-[#0a0a0a] overflow-hidden">
      <iframe
        src={docsUrl}
        className="w-full flex-1 border-none bg-[#0a0a0a]"
        title="OPO Studio Documentation"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
