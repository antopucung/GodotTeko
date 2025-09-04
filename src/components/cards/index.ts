// Card Component System
// Modular, extensible, and consistent card components

// Base components
export { default as BaseCard } from './BaseCard'
export type { BaseCardProps } from './BaseCard'

// Specific card implementations
export { default as ProductCard } from './ProductCard'
export type { ProductCardProps } from './ProductCard'

export { default as CourseCard } from './CourseCard'
export type { CourseCardProps, CourseData } from './CourseCard'

export { default as TemplateCard } from './TemplateCard'
export type { TemplateCardProps, TemplateData } from './TemplateCard'

// Future card types can be added here:
// export { default as ArticleCard } from './ArticleCard'
// export { default as ToolCard } from './ToolCard'
