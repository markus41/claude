/**
 * Cowork Curated Collections
 *
 * Pre-built collections that group cowork items by use case,
 * making it easy to discover related capabilities across plugins.
 */

import type { CoworkCollection } from '@/types/cowork';
import { COWORK_CATALOG } from './catalog';

function itemsByNames(names: string[]) {
  return COWORK_CATALOG.filter((item) => names.includes(item.name));
}

export const COWORK_COLLECTIONS: CoworkCollection[] = [
  {
    id: 'col-startup-launch',
    name: 'Startup Launch Kit',
    description:
      'Everything you need to go from idea to deployed product: scaffolding, backend, frontend, CI/CD, and monitoring.',
    iconEmoji: '🚀',
    items: itemsByNames([
      'fastapi-scaffold',
      'fullstack-react-fastapi',
      'eks-deploy-pipeline',
      'project-scaffolder',
      'devops-essentials',
    ]),
    tags: ['startup', 'full-stack', 'deployment', 'ci-cd'],
  },
  {
    id: 'col-enterprise-ops',
    name: 'Enterprise Operations',
    description:
      'Enterprise-grade workflows for sprint planning, release management, code review, and Jira orchestration.',
    iconEmoji: '🏢',
    items: itemsByNames([
      'jira-to-pr',
      'sprint-planning-automation',
      'enterprise-release',
      'enterprise-code-reviewer',
    ]),
    tags: ['enterprise', 'jira', 'release', 'agile'],
  },
  {
    id: 'col-devops-mastery',
    name: 'DevOps Mastery',
    description:
      'Complete DevOps toolkit: Docker, Kubernetes, Helm, Terraform, Ansible, Harness pipelines, and deployment monitoring.',
    iconEmoji: '⚙️',
    items: itemsByNames([
      'devops-essentials',
      'eks-deploy-pipeline',
      'enterprise-release',
    ]),
    tags: ['devops', 'kubernetes', 'docker', 'terraform', 'ci-cd'],
  },
  {
    id: 'col-microsoft-ecosystem',
    name: 'Microsoft Ecosystem',
    description:
      'Full Microsoft platform deployment: Azure, Dataverse, Fabric, Power Platform, Entra, and Teams integration.',
    iconEmoji: '🪟',
    items: itemsByNames([
      'microsoft-platform-deploy',
    ]),
    tags: ['microsoft', 'azure', 'power-platform', 'fabric', 'teams'],
  },
  {
    id: 'col-design-frontend',
    name: 'Design & Frontend',
    description:
      'Build beautiful interfaces: design system creation, 263+ styles, React animations, accessibility auditing, and Keycloak theming.',
    iconEmoji: '🎨',
    items: itemsByNames([
      'design-system-architect',
      'react-animation-toolkit',
    ]),
    tags: ['design', 'frontend', 'animation', 'accessibility', 'theming'],
  },
  {
    id: 'col-smart-home',
    name: 'Smart Home Automation',
    description:
      'Set up a complete smart home: Home Assistant deployment, energy management, camera NVR, automations, and local AI with Ollama.',
    iconEmoji: '🏠',
    items: itemsByNames([
      'home-assistant-setup',
    ]),
    tags: ['home-assistant', 'iot', 'smart-home', 'automation', 'energy'],
  },
  {
    id: 'col-nonprofit',
    name: 'Nonprofit & Association',
    description:
      'AI-powered nonprofit management: executive director automation, membership, events, compliance, and sponsor relations.',
    iconEmoji: '🤝',
    items: itemsByNames([
      'nonprofit-exec-director',
    ]),
    tags: ['nonprofit', 'association', 'membership', 'compliance', 'events'],
  },
  {
    id: 'col-security-auth',
    name: 'Security & Authentication',
    description:
      'Multi-tenant identity management: Keycloak realms, RBAC, OIDC integration, theme customization, and compliance.',
    iconEmoji: '🔐',
    items: itemsByNames([
      'keycloak-multi-tenant',
    ]),
    tags: ['keycloak', 'security', 'authentication', 'multi-tenant', 'rbac'],
  },
  {
    id: 'col-plugin-ecosystem',
    name: 'Plugin Ecosystem Tools',
    description:
      'Meta-tools for the plugin ecosystem: marketplace intelligence, intent composition, trust scoring, and federation.',
    iconEmoji: '🔌',
    items: itemsByNames([
      'marketplace-intelligence',
    ]),
    tags: ['marketplace', 'plugins', 'composition', 'trust', 'federation'],
  },
];
