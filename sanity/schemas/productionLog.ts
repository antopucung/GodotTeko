import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'productionLog',
  title: 'Production Log',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({
      name: 'title',
      title: 'Log Title',
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
      }
    }),
    defineField({
      name: 'project',
      title: 'Game Project',
      type: 'reference',
      to: [{ type: 'gameProject' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'object',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'role', type: 'string', title: 'Role in Project' },
        { name: 'avatar', type: 'image', title: 'Avatar', options: { hotspot: true } },
        { name: 'user', type: 'reference', to: [{ type: 'user' }], title: 'User Account' }
      ]
    }),
    defineField({
      name: 'content',
      title: 'Log Content',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'summary',
      title: 'Short Summary',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.max(200)
    }),
    defineField({
      name: 'logType',
      title: 'Log Type',
      type: 'string',
      options: {
        list: [
          { title: 'Development Update', value: 'dev_update' },
          { title: 'Milestone Reached', value: 'milestone' },
          { title: 'Behind the Scenes', value: 'behind_scenes' },
          { title: 'Technical Deep Dive', value: 'technical' },
          { title: 'Art Showcase', value: 'art_showcase' },
          { title: 'Challenges & Solutions', value: 'challenges' },
          { title: 'Team Spotlight', value: 'team_spotlight' },
          { title: 'Community Update', value: 'community' },
          { title: 'Release Notes', value: 'release_notes' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'developmentPhase',
      title: 'Development Phase',
      type: 'string',
      options: {
        list: [
          'Pre-production', 'Concept', 'Prototyping', 'Production',
          'Alpha', 'Beta', 'Polish', 'Release', 'Post-launch'
        ]
      }
    }),
    defineField({
      name: 'media',
      title: 'Media Attachments',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'type', type: 'string', title: 'Media Type', options: {
              list: ['image', 'video', 'gif', 'file']
            }},
            { name: 'title', type: 'string', title: 'Media Title' },
            { name: 'image', type: 'image', title: 'Image', options: { hotspot: true } },
            { name: 'video', type: 'object', title: 'Video', fields: [
              { name: 'url', type: 'url', title: 'Video URL' },
              { name: 'embedId', type: 'string', title: 'Embed ID' },
              { name: 'platform', type: 'string', title: 'Platform', options: {
                list: ['youtube', 'vimeo', 'twitch', 'direct']
              }},
              { name: 'duration', type: 'string', title: 'Duration' }
            ]},
            { name: 'file', type: 'file', title: 'File Attachment' },
            { name: 'caption', type: 'string', title: 'Caption' },
            { name: 'description', type: 'text', title: 'Description' }
          ]
        }
      ]
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'programming', 'art', 'design', 'audio', 'testing', 'optimization',
          'ui-ux', 'gameplay', 'story', 'characters', 'environment',
          'tools', 'pipeline', 'team', 'milestone', 'challenge', 'solution'
        ],
        layout: 'tags'
      }
    }),
    defineField({
      name: 'mood',
      title: 'Team Mood',
      type: 'string',
      options: {
        list: [
          { title: '🚀 Excited', value: 'excited' },
          { title: '💪 Motivated', value: 'motivated' },
          { title: '😊 Happy', value: 'happy' },
          { title: '😐 Neutral', value: 'neutral' },
          { title: '😰 Stressed', value: 'stressed' },
          { title: '😤 Frustrated', value: 'frustrated' },
          { title: '🤔 Thoughtful', value: 'thoughtful' },
          { title: '🎉 Celebrating', value: 'celebrating' }
        ]
      }
    }),
    defineField({
      name: 'workHours',
      title: 'Hours Worked This Week',
      type: 'number'
    }),
    defineField({
      name: 'progressPercentage',
      title: 'Overall Progress (%)',
      type: 'number',
      validation: Rule => Rule.min(0).max(100)
    }),
    defineField({
      name: 'nextGoals',
      title: 'Next Goals',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'What the team plans to work on next'
    }),
    defineField({
      name: 'stats',
      title: 'Engagement Stats',
      type: 'object',
      fields: [
        { name: 'views', type: 'number', title: 'Views', initialValue: 0 },
        { name: 'likes', type: 'number', title: 'Likes', initialValue: 0 },
        { name: 'comments', type: 'number', title: 'Comments', initialValue: 0 },
        { name: 'shares', type: 'number', title: 'Shares', initialValue: 0 }
      ]
    }),
    defineField({
      name: 'isPublic',
      title: 'Public Log',
      type: 'boolean',
      initialValue: true,
      description: 'Whether this log is visible to the public'
    }),
    defineField({
      name: 'isPinned',
      title: 'Pinned',
      type: 'boolean',
      initialValue: false,
      description: 'Pin this log to the top of the project page'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'editedAt',
      title: 'Last Edited',
      type: 'datetime'
    })
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }]
    },
    {
      title: 'Published Date, Old',
      name: 'publishedAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }]
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'project.title',
      media: 'media.0.image',
      author: 'author.name',
      date: 'publishedAt'
    },
    prepare(selection) {
      const { title, subtitle, media, author, date } = selection
      const formattedDate = date ? new Date(date).toLocaleDateString() : ''
      return {
        title,
        subtitle: `${subtitle} • ${author} • ${formattedDate}`,
        media
      }
    }
  }
})
