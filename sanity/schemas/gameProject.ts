import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'gameProject',
  title: 'Game Development Project',
  type: 'document',
  icon: () => '🎮',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Project Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required().min(50).max(500)
    }),
    defineField({
      name: 'longDescription',
      title: 'Detailed Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full project description with rich text formatting'
    }),
    defineField({
      name: 'poster',
      title: 'Project Poster',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'gallery',
      title: 'Project Gallery',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'image', type: 'image', title: 'Image', options: { hotspot: true } },
            { name: 'caption', type: 'string', title: 'Caption' },
            { name: 'category', type: 'string', title: 'Category', options: {
              list: ['screenshot', 'concept_art', 'behind_scenes', 'ui_design', 'character_art', 'environment']
            }}
          ]
        }
      ]
    }),
    defineField({
      name: 'videos',
      title: 'Project Videos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Video Title' },
            { name: 'url', type: 'url', title: 'Video URL (YouTube/Vimeo)' },
            { name: 'embedId', type: 'string', title: 'Video Embed ID' },
            { name: 'thumbnail', type: 'image', title: 'Custom Thumbnail', options: { hotspot: true } },
            { name: 'duration', type: 'string', title: 'Duration (e.g., "5:32")' },
            { name: 'category', type: 'string', title: 'Video Category', options: {
              list: ['gameplay', 'dev_log', 'tutorial', 'timelapse', 'trailer', 'behind_scenes']
            }},
            { name: 'description', type: 'text', title: 'Video Description' }
          ]
        }
      ]
    }),
    defineField({
      name: 'studio',
      title: 'Development Studio',
      type: 'reference',
      to: [{ type: 'gameStudio' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Project Status',
      type: 'string',
      options: {
        list: [
          { title: 'Released', value: 'released' },
          { title: 'In Development', value: 'in_development' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'On Hold', value: 'on_hold' },
          { title: 'Early Access', value: 'early_access' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date'
    }),
    defineField({
      name: 'developmentStartDate',
      title: 'Development Start Date',
      type: 'date'
    }),
    defineField({
      name: 'platforms',
      title: 'Platforms',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'PC', 'Steam', 'Epic Games Store', 'GOG',
          'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One',
          'Nintendo Switch', 'iOS', 'Android', 'Web Browser',
          'VR (Meta Quest)', 'VR (Steam VR)', 'Linux', 'macOS'
        ]
      }
    }),
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle',
          'Racing', 'Sports', 'Fighting', 'Shooter', 'Platformer',
          'Horror', 'Survival', 'Roguelike', 'Metroidvania', 'Battle Royale',
          'MMORPG', 'Casual', 'Indie', 'Arcade', 'Educational'
        ]
      }
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies & Tools',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Technology Name' },
            { name: 'category', type: 'string', title: 'Category', options: {
              list: ['engine', 'programming', 'art', 'audio', 'tool', 'platform', 'middleware']
            }},
            { name: 'usage', type: 'string', title: 'How it was used' }
          ]
        }
      ]
    }),
    defineField({
      name: 'teamSize',
      title: 'Team Size',
      type: 'number'
    }),
    defineField({
      name: 'developmentDuration',
      title: 'Development Duration',
      type: 'string',
      description: 'e.g., "18 months", "2.5 years"'
    }),
    defineField({
      name: 'budget',
      title: 'Development Budget',
      type: 'object',
      fields: [
        { name: 'amount', type: 'number', title: 'Amount' },
        { name: 'currency', type: 'string', title: 'Currency', options: { list: ['USD', 'EUR', 'GBP', 'CAD'] }},
        { name: 'isPublic', type: 'boolean', title: 'Show publicly', initialValue: false }
      ]
    }),
    defineField({
      name: 'postMortemSections',
      title: 'Post-Mortem Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Section Title' },
            { name: 'content', type: 'array', of: [{ type: 'block' }], title: 'Content' },
            { name: 'category', type: 'string', title: 'Category', options: {
              list: ['what_worked', 'what_didnt', 'lessons_learned', 'technical_challenges', 'design_decisions', 'marketing', 'team_dynamics']
            }}
          ]
        }
      ]
    }),
    defineField({
      name: 'downloadableAssets',
      title: 'Downloadable Assets',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Asset Title' },
            { name: 'description', type: 'text', title: 'Description' },
            { name: 'file', type: 'file', title: 'File' },
            { name: 'fileSize', type: 'string', title: 'File Size' },
            { name: 'license', type: 'string', title: 'License', options: {
              list: ['MIT', 'CC BY', 'CC BY-SA', 'CC0', 'Custom', 'All Rights Reserved']
            }},
            { name: 'requiresAuth', type: 'boolean', title: 'Requires Authentication', initialValue: false }
          ]
        }
      ]
    }),
    defineField({
      name: 'stats',
      title: 'Project Statistics',
      type: 'object',
      fields: [
        { name: 'views', type: 'number', title: 'Views', initialValue: 0 },
        { name: 'likes', type: 'number', title: 'Likes', initialValue: 0 },
        { name: 'downloads', type: 'number', title: 'Downloads', initialValue: 0 },
        { name: 'comments', type: 'number', title: 'Comments', initialValue: 0 }
      ]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Project',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'submittedBy',
      title: 'Submitted By',
      type: 'reference',
      to: [{ type: 'user' }]
    }),
    defineField({
      name: 'moderationStatus',
      title: 'Moderation Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Pending Review', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' },
          { title: 'Published', value: 'published' }
        ]
      },
      initialValue: 'draft'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'externalLinks',
      title: 'External Links',
      type: 'object',
      fields: [
        { name: 'website', type: 'url', title: 'Project Website' },
        { name: 'steam', type: 'url', title: 'Steam Page' },
        { name: 'itchIo', type: 'url', title: 'itch.io Page' },
        { name: 'github', type: 'url', title: 'GitHub Repository' },
        { name: 'discord', type: 'url', title: 'Discord Server' },
        { name: 'twitter', type: 'url', title: 'Twitter/X' },
        { name: 'youtube', type: 'url', title: 'YouTube Channel' }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'studio.name',
      media: 'poster',
      status: 'status'
    },
    prepare(selection) {
      const { title, subtitle, media, status } = selection
      return {
        title,
        subtitle: `${subtitle} • ${status}`,
        media
      }
    }
  }
})
