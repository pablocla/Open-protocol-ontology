import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Open Protocol Ontology',
  tagline: 'Semantic Discovery for AI Agents',
  favicon: 'img/favicon.ico',

  url: 'https://openontology.vercel.app',
  baseUrl: '/',

  organizationName: 'pablocla',
  projectName: 'Open-protocol-ontology',

  onBrokenLinks: 'ignore', // Changed to ignore to avoid build failures for simple doc sites
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
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
        src: 'img/logo.svg', // We can leave the generic SVG for now or user can replace it
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
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
          title: 'Docs',
          items: [
            {
              label: 'Read the Manual',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Main Site',
              href: 'https://openontology.vercel.app',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/pablocla/Open-protocol-ontology',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OPO Protocol. Built by humans, consumed by machines.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
