import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: () => '⚙️',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      }
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main headline on homepage'
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'string',
      description: 'Subtitle text on homepage'
    }),
    defineField({
      name: 'heroStats',
      title: 'Hero Statistics',
      type: 'object',
      fields: [
        {
          name: 'totalProducts',
          title: 'Total Products',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'totalUsers',
          title: 'Total Users',
          type: 'number',
          initialValue: 0
        },
        {
          name: 'totalSales',
          title: 'Total Sales',
          type: 'number',
          initialValue: 0
        }
      ]
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        {
          name: 'dribbble',
          title: 'Dribbble',
          type: 'url'
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url'
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'url'
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email'
        }
      ]
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'email'
    }),
    defineField({
      name: 'maintenanceMode',
      title: 'Maintenance Mode',
      type: 'boolean',
      description: 'Enable to show maintenance page',
      initialValue: false
    }),
    defineField({
      name: 'featuredCategories',
      title: 'Featured Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      description: 'Categories to highlight on homepage'
    }),
    defineField({
      name: 'announcements',
      title: 'Announcements',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string'
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text'
            },
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Info', value: 'info'},
                  {title: 'Warning', value: 'warning'},
                  {title: 'Success', value: 'success'},
                  {title: 'Error', value: 'error'}
                ]
              }
            },
            {
              name: 'active',
              title: 'Active',
              type: 'boolean',
              initialValue: true
            },
            {
              name: 'link',
              title: 'Link',
              type: 'url'
            }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'siteName',
      subtitle: 'siteDescription'
    }
  }
})
