import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'projectComment',
  title: 'Project Comment',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({
      name: 'project',
      title: 'Game Project',
      type: 'reference',
      to: [{ type: 'gameProject' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'productionLog',
      title: 'Production Log',
      type: 'reference',
      to: [{ type: 'productionLog' }],
      description: 'If this comment is on a specific production log'
    }),
    defineField({
      name: 'author',
      title: 'Comment Author',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'content',
      title: 'Comment Content',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'parentComment',
      title: 'Parent Comment',
      type: 'reference',
      to: [{ type: 'projectComment' }],
      description: 'For threaded replies'
    }),
    defineField({
      name: 'commentType',
      title: 'Comment Type',
      type: 'string',
      options: {
        list: [
          { title: 'General Comment', value: 'general' },
          { title: 'Question', value: 'question' },
          { title: 'Feedback', value: 'feedback' },
          { title: 'Bug Report', value: 'bug_report' },
          { title: 'Feature Request', value: 'feature_request' },
          { title: 'Praise', value: 'praise' },
          { title: 'Criticism', value: 'criticism' },
          { title: 'Technical Discussion', value: 'technical' }
        ]
      },
      initialValue: 'general'
    }),
    defineField({
      name: 'isQuestion',
      title: 'Is Question',
      type: 'boolean',
      initialValue: false,
      description: 'Mark this comment as a question for Q&A sections'
    }),
    defineField({
      name: 'isAnswered',
      title: 'Question Answered',
      type: 'boolean',
      initialValue: false,
      description: 'Has this question been answered by the developer?'
    }),
    defineField({
      name: 'developerReply',
      title: 'Developer Reply',
      type: 'reference',
      to: [{ type: 'projectComment' }],
      description: 'Official developer response to this comment'
    }),
    defineField({
      name: 'reactions',
      title: 'Reactions',
      type: 'object',
      fields: [
        { name: 'likes', type: 'number', title: 'Likes', initialValue: 0 },
        { name: 'hearts', type: 'number', title: 'Hearts', initialValue: 0 },
        { name: 'laughs', type: 'number', title: 'Laughs', initialValue: 0 },
        { name: 'surprised', type: 'number', title: 'Surprised', initialValue: 0 },
        { name: 'thumbsUp', type: 'number', title: 'Thumbs Up', initialValue: 0 },
        { name: 'thumbsDown', type: 'number', title: 'Thumbs Down', initialValue: 0 }
      ]
    }),
    defineField({
      name: 'replyCount',
      title: 'Reply Count',
      type: 'number',
      initialValue: 0,
      description: 'Number of replies to this comment'
    }),
    defineField({
      name: 'moderationStatus',
      title: 'Moderation Status',
      type: 'string',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Pending Review', value: 'pending' },
          { title: 'Flagged', value: 'flagged' },
          { title: 'Hidden', value: 'hidden' },
          { title: 'Deleted', value: 'deleted' }
        ]
      },
      initialValue: 'published'
    }),
    defineField({
      name: 'flaggedReason',
      title: 'Flagged Reason',
      type: 'string',
      options: {
        list: [
          'Spam', 'Inappropriate Content', 'Harassment', 'Off-topic',
          'Copyright Violation', 'False Information', 'Other'
        ]
      }
    }),
    defineField({
      name: 'attachments',
      title: 'Attachments',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'type', type: 'string', title: 'Type', options: {
              list: ['image', 'video', 'link', 'file']
            }},
            { name: 'image', type: 'image', title: 'Image', options: { hotspot: true } },
            { name: 'url', type: 'url', title: 'URL' },
            { name: 'file', type: 'file', title: 'File' },
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'description', type: 'text', title: 'Description' }
          ]
        }
      ]
    }),
    defineField({
      name: 'isEdited',
      title: 'Is Edited',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'editHistory',
      title: 'Edit History',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'editedAt', type: 'datetime', title: 'Edited At' },
            { name: 'reason', type: 'string', title: 'Edit Reason' },
            { name: 'previousContent', type: 'text', title: 'Previous Content' }
          ]
        }
      ]
    }),
    defineField({
      name: 'isPinned',
      title: 'Pinned Comment',
      type: 'boolean',
      initialValue: false,
      description: 'Pin this comment to the top'
    }),
    defineField({
      name: 'isDeveloperComment',
      title: 'Developer Comment',
      type: 'boolean',
      initialValue: false,
      description: 'Comment from the project developer/studio'
    }),
    defineField({
      name: 'isHighlighted',
      title: 'Highlighted',
      type: 'boolean',
      initialValue: false,
      description: 'Highlight this comment for special attention'
    }),
    defineField({
      name: 'postedAt',
      title: 'Posted At',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'editedAt',
      title: 'Last Edited',
      type: 'datetime'
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Browser/device info for moderation purposes'
    }),
    defineField({
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'For moderation and spam prevention'
    })
  ],
  orderings: [
    {
      title: 'Posted Date, New',
      name: 'postedDesc',
      by: [{ field: 'postedAt', direction: 'desc' }]
    },
    {
      title: 'Posted Date, Old',
      name: 'postedAsc',
      by: [{ field: 'postedAt', direction: 'asc' }]
    },
    {
      title: 'Most Liked',
      name: 'mostLiked',
      by: [{ field: 'reactions.likes', direction: 'desc' }]
    }
  ],
  preview: {
    select: {
      title: 'content',
      subtitle: 'author.name',
      project: 'project.title',
      date: 'postedAt'
    },
    prepare(selection) {
      const { title, subtitle, project, date } = selection
      const contentPreview = title?.[0]?.children?.[0]?.text?.substring(0, 100) || 'Comment'
      const formattedDate = date ? new Date(date).toLocaleDateString() : ''
      return {
        title: contentPreview,
        subtitle: `${project} • ${subtitle} • ${formattedDate}`
      }
    }
  }
})
