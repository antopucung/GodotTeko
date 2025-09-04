import { mongoose } from '../database'

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: {
    current: { type: String, required: true, unique: true }
  },
  description: { type: String, required: true },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: ['released', 'in_development', 'prototype'],
    default: 'in_development'
  },
  poster: { type: String, default: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=1200&fit=crop' },
  studio: {
    name: { type: String, required: true },
    slug: {
      current: { type: String, required: true }
    },
    id: { type: String }
  },
  platforms: [{ type: String }],
  genre: [{ type: String }],
  tech: [{ type: String }],
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 }
  },
  duration: { type: String, required: true },
  team: {
    size: { type: Number, required: true },
    roles: [{ type: String }]
  },
  featured: { type: Boolean, default: false },
  assets: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'code'],
      required: true
    },
    url: { type: String, required: true },
    description: { type: String }
  }],
  postMortem: { type: String },
  approved: { type: Boolean, default: false },
  submittedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Generate slug from title if not provided
ProjectSchema.pre('save', function(next) {
  if (!this.slug.current && this.title) {
    this.slug.current = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  this.updatedAt = new Date()
  next()
})

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)
