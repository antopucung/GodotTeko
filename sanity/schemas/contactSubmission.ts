import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'contactSubmission',
  title: 'Contact Submission',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'In Progress', value: 'in-progress'},
          {title: 'Resolved', value: 'resolved'},
          {title: 'Closed', value: 'closed'}
        ]
      },
      initialValue: 'new'
    }),
    defineField({
      name: 'response',
      title: 'Response',
      type: 'text',
      rows: 4
    }),
    defineField({
      name: 'respondedAt',
      title: 'Responded At',
      type: 'datetime'
    })
  ],
  preview: {
    select: {
      title: 'subject',
      subtitle: 'name',
      email: 'email',
      status: 'status'
    },
    prepare(selection) {
      const {title, subtitle, email, status} = selection
      return {
        title: title,
        subtitle: `${subtitle} (${email}) • ${status}`
      }
    }
  }
})
