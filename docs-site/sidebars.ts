import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '🏠 Introducción',
    },
    {
      type: 'category',
      label: '💡 Conceptos Clave',
      collapsed: false,
      items: [
        'conceptos/ontologia-empresarial',
        'conceptos/cognitive-mesh',
        'conceptos/empleados-virtuales',
      ],
    },
    {
      type: 'category',
      label: '🎨 OPO Studio',
      collapsed: false,
      items: [
        'studio/vision-general',
        'studio/flujo-usuario-completo',
        'studio/onboarding',
        'studio/canvas-visual',
        'studio/agentes-y-swarm',
        'studio/mosaico-ia',
        'studio/generacion-mcp',
        'studio/intents-declarativos',
        'studio/mesh-panel',
        'studio/configuracion',
        'studio/rest-explorer',
      ],
    },
    {
      type: 'category',
      label: '🔌 Integraciones ERP',
      collapsed: true,
      items: [
        'erps/totvs-protheus',
        'erps/sap-s4hana',
        'erps/odoo-17',
      ],
    },
    {
      type: 'category',
      label: '📖 Referencia Técnica',
      collapsed: true,
      items: [
        'opoql-query-language',
        'sdk-reference',
        'referencia/sql-translator',
        'referencia/arquitectura',
      ],
    },
  ],
};

export default sidebars;
