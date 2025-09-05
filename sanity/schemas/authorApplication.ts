import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'authorApplication',
  title: 'Author Application',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'portfolioLink',
      title: 'Portfolio Link',
      type: 'url',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'additionalInfo',
      title: 'Additional Information',
      type: 'text',
      rows: 4
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Under Review', value: 'review'}
        ]
      },
      initialValue: 'pending'
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'reviewedAt',
      title: 'Reviewed At',
      type: 'datetime'
    }),
    defineField({
      name: 'reviewNotes',
      title: 'Review Notes',
      type: 'text',
      rows: 3
    })
  ],
  preview: {
    select: {
      title: 'fullName',
      subtitle: 'email',
      status: 'status'
    },
    prepare(selection) {
      const {title, subtitle, status} = selection
      return {
        title: title,
        subtitle: `${subtitle} • ${status}`
      }
    }
  }
})
