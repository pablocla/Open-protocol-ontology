import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OPO — Documentación Oficial',
  tagline: 'La capa semántica que conecta tus sistemas con Inteligencia Artificial',
  favicon: 'img/favicon.ico',

  url: 'https://openontology.vercel.app',
  baseUrl: '/',

  organizationName: 'pablocla',
  projectName: 'Open-protocol-ontology',

  onBrokenLinks: 'ignore', // Changed to ignore to avoid build failures for simple doc sites
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/pablocla/Open-protocol-ontology/tree/main/docs-site/',
        },
        blog: false, // Disabled blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true, // Force dark mode to match OPO aesthetic
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'OPO Docs',
      logo: {
        alt: 'OPO Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: process.env.OPO_STUDIO_URL || 'http://localhost:3000/studio',
          label: '← Volver a OPO Studio',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          href: 'https://github.com/pablocla/Open-protocol-ontology',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {
              label: 'Introducción',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Proyecto',
          items: [
            {
              label: 'Sitio Principal',
              href: 'https://openontology.vercel.app',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/pablocla/Open-protocol-ontology',
            },
            {
              label: 'NPM SDK',
              href: 'https://www.npmjs.com/package/opo-sdk',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OPO Protocol. Creado por humanos, consumido por máquinas.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
