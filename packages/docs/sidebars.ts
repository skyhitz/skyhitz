import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Tokenomics & Rewards',
      items: [
        'tokenomics/rewards',
        'tokenomics/apr-math',
        'tokenomics/flows',
      ],
    },
    'architecture/overview',
    {
      type: 'category',
      label: 'Backend',
      items: [
        'backend/graphql',
        'backend/algolia',
        'backend/stellar-soroban',
        'backend/r2-storage',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/app-structure',
        'frontend/player',
        'frontend/search-and-external',
      ],
    },
    'operations/deploy',
  ],
}

export default sidebars


