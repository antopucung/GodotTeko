export default {
  name: 'userOnboarding',
  title: 'User Onboarding',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'data',
      title: 'Onboarding Data',
      type: 'object',
      fields: [
        {
          name: 'interests',
          title: 'Interests',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'User selected interests and favorite categories'
        },
        {
          name: 'experience',
          title: 'Experience Level',
          type: 'string',
          options: {
            list: [
              { title: 'Beginner', value: 'beginner' },
              { title: 'Intermediate', value: 'intermediate' },
              { title: 'Advanced', value: 'advanced' },
              { title: 'Expert', value: 'expert' }
            ]
          }
        },
        {
          name: 'primaryUse',
          title: 'Primary Use Case',
          type: 'string',
          options: {
            list: [
              { title: 'Personal Projects', value: 'personal' },
              { title: 'Freelance Work', value: 'freelance' },
              { title: 'Agency/Company', value: 'agency' },
              { title: 'Startup', value: 'startup' }
            ]
          }
        },
        {
          name: 'favoriteCategories',
          title: 'Favorite Categories',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Categories the user is most interested in'
        },
        {
          name: 'bio',
          title: 'Bio',
          type: 'text',
          description: 'User provided bio during onboarding'
        },
        {
          name: 'website',
          title: 'Website',
          type: 'url',
          description: 'User website or portfolio'
        }
      ]
    },
    {
      name: 'version',
      title: 'Onboarding Version',
      type: 'string',
      description: 'Version of the onboarding flow used'
    },
    {
      name: 'recommendations',
      title: 'Generated Recommendations',
      type: 'object',
      fields: [
        {
          name: 'products',
          title: 'Recommended Products',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'product' }] }]
        },
        {
          name: 'categories',
          title: 'Recommended Categories',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'category' }] }]
        }
      ]
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {
          name: 'userAgent',
          title: 'User Agent',
          type: 'string'
        },
        {
          name: 'referralSource',
          title: 'Referral Source',
          type: 'string'
        },
        {
          name: 'completionTime',
          title: 'Completion Time (seconds)',
          type: 'number',
          description: 'Time taken to complete onboarding'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'completedAt',
      experience: 'data.experience'
    },
    prepare(selection: any) {
      const { title, subtitle, experience } = selection
      return {
        title: title || 'User Onboarding',
        subtitle: `${experience ? experience + ' • ' : ''}${new Date(subtitle).toLocaleDateString()}`
      }
    }
  }
}
