import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email()
    }),
    defineField({
      name: 'password',
      title: 'Password Hash',
      type: 'string',
      description: 'Hashed password for credentials login'
    }),
    defineField({
      name: 'image',
      title: 'Profile Image',
      type: 'url',
      description: 'Profile picture URL from OAuth or uploaded'
    }),
    defineField({
      name: 'role',
      title: 'User Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Partner', value: 'partner' },
          { title: 'Admin', value: 'admin' }
        ],
        layout: 'radio'
      },
      initialValue: 'user',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'verified',
      title: 'Email Verified',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'provider',
      title: 'Auth Provider',
      type: 'string',
      options: {
        list: [
          { title: 'Credentials', value: 'credentials' },
          { title: 'Google', value: 'google' },
          { title: 'GitHub', value: 'github' }
        ]
      }
    }),
    defineField({
      name: 'providerId',
      title: 'Provider ID',
      type: 'string',
      description: 'External provider user ID'
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
      description: 'User biography for profile'
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      description: 'Personal or company website'
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      description: 'Company or organization name'
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City, country'
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({
          name: 'twitter',
          title: 'Twitter',
          type: 'url'
        }),
        defineField({
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url'
        }),
        defineField({
          name: 'dribbble',
          title: 'Dribbble',
          type: 'url'
        }),
        defineField({
          name: 'behance',
          title: 'Behance',
          type: 'url'
        })
      ]
    }),
    defineField({
      name: 'preferences',
      title: 'User Preferences',
      type: 'object',
      fields: [
        defineField({
          name: 'newsletter',
          title: 'Newsletter Subscription',
          type: 'boolean',
          initialValue: true
        }),
        defineField({
          name: 'notifications',
          title: 'Email Notifications',
          type: 'boolean',
          initialValue: true
        }),
        defineField({
          name: 'theme',
          title: 'Theme Preference',
          type: 'string',
          options: {
            list: [
              { title: 'Light', value: 'light' },
              { title: 'Dark', value: 'dark' },
              { title: 'System', value: 'system' }
            ]
          },
          initialValue: 'system'
        })
      ]
    }),
    defineField({
      name: 'likedProducts',
      title: 'Liked Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      description: 'Products the user has liked'
    }),
    defineField({
      name: 'stats',
      title: 'User Statistics',
      type: 'object',
      fields: [
        defineField({
          name: 'totalPurchases',
          title: 'Total Purchases',
          type: 'number',
          initialValue: 0
        }),
        defineField({
          name: 'totalSpent',
          title: 'Total Amount Spent',
          type: 'number',
          initialValue: 0
        }),
        defineField({
          name: 'favoriteCategories',
          title: 'Favorite Categories',
          type: 'array',
          of: [{ type: 'string' }]
        }),
        defineField({
          name: 'lastLoginAt',
          title: 'Last Login',
          type: 'datetime'
        })
      ]
    }),
    defineField({
      name: 'partnerInfo',
      title: 'Partner Information',
      type: 'object',
      hidden: ({ document }) => document?.role !== 'partner',
      fields: [
        defineField({
          name: 'approved',
          title: 'Partner Approved',
          type: 'boolean',
          initialValue: false
        }),
        defineField({
          name: 'approvedAt',
          title: 'Approved Date',
          type: 'datetime'
        }),
        defineField({
          name: 'approvedBy',
          title: 'Approved By',
          type: 'reference',
          to: [{ type: 'user' }]
        }),
        defineField({
          name: 'commissionRate',
          title: 'Commission Rate (%)',
          type: 'number',
          validation: Rule => Rule.min(0).max(100),
          initialValue: 70
        }),
        defineField({
          name: 'totalEarnings',
          title: 'Total Earnings',
          type: 'number',
          initialValue: 0
        }),
        defineField({
          name: 'productsPublished',
          title: 'Products Published',
          type: 'number',
          initialValue: 0
        })
      ]
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
      role: 'role'
    },
    prepare(selection) {
      const { title, subtitle, role } = selection
      return {
        title,
        subtitle: `${subtitle} • ${role}`,
        media: selection.media
      }
    }
  }
})
