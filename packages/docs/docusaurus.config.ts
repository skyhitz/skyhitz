import type { Config } from '@docusaurus/types'
import { themes as prismThemes } from 'prism-react-renderer'

const config: Config = {
  title: 'Skyhitz Docs',
  tagline: 'Music discovery, investing, and streaming',
  url: 'https://docs.skyhitz.io',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'skyhitz',
  projectName: 'docs',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl: undefined,
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],
  themeConfig: {
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Skyhitz',
      items: [
        { href: 'https://skyhitz.io', label: 'App', position: 'right' },
        { href: 'https://github.com/skyhitz/skyhitz', label: 'GitHub', position: 'right' },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
}

export default config


