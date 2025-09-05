import { SITE_CONFIG, METRICS, FEATURES } from '@/config/constants'

export const siteConfig = {
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  logo: {
    width: 32,
    height: 32,
    svg: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="8" fill="currentColor"/>
      <circle cx="24" cy="8" r="8" fill="currentColor"/>
      <circle cx="16" cy="24" r="8" fill="currentColor"/>
    </svg>`
  },
  hero: {
    title: `${METRICS.hero.totalResources.toLocaleString()} curated design resources to speed up your creative workflow.`,
    subtitle: `Join a growing family of ${METRICS.hero.totalMembers.toLocaleString()} designers and makers from around the world.`,
    stats: {
      resources: METRICS.hero.totalResources,
      members: METRICS.hero.totalMembers
    }
  },
  company: {
    name: SITE_CONFIG.company.legalName,
    year: new Date().getFullYear(),
    email: SITE_CONFIG.company.email
  },
  social: {
    dribbble: "https://dribbble.com/ui8",
    instagram: "https://www.instagram.com/ui8net/",
    twitter: "https://twitter.com/ui8",
    email: `mailto:${SITE_CONFIG.company.email}`
  },
  features: FEATURES
}
