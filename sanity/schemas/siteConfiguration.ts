import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteConfiguration',
  title: 'Site Configuration',
  type: 'document',
  icon: () => '🎨',
  fields: [
    defineField({
      name: 'title',
      title: 'Configuration Title',
      type: 'string',
      description: 'Internal name for this configuration',
      validation: Rule => Rule.required()
    }),

    // Logo Configuration
    defineField({
      name: 'logo',
      title: 'Logo Settings',
      type: 'object',
      fields: [
        {
          name: 'useDefaultLogo',
          title: 'Use Default Godot Tekko Logo',
          type: 'boolean',
          description: 'Enable to use the default Godot Tekko logo, disable to use custom uploaded logo',
          initialValue: true
        },
        {
          name: 'logoImage',
          title: 'Custom Logo Image',
          type: 'image',
          description: 'Upload your custom logo (used when default logo is disabled)',
          options: {
            hotspot: true,
            metadata: ['blurhash', 'lqip', 'palette']
          },
          hidden: ({ parent }) => parent?.useDefaultLogo === true
        },
        {
          name: 'logoText',
          title: 'Logo Text',
          type: 'string',
          description: 'Text to display with/instead of logo',
          initialValue: 'Godot Tekko'
        },
        {
          name: 'showText',
          title: 'Show Logo Text',
          type: 'boolean',
          description: 'Display text alongside or instead of image',
          initialValue: true
        },
        {
          name: 'logoSize',
          title: 'Logo Size',
          type: 'object',
          fields: [
            {
              name: 'width',
              title: 'Width (px)',
              type: 'number',
              initialValue: 32,
              validation: Rule => Rule.min(16).max(200)
            },
            {
              name: 'height',
              title: 'Height (px)',
              type: 'number',
              initialValue: 32,
              validation: Rule => Rule.min(16).max(200)
            }
          ]
        },
        {
          name: 'altText',
          title: 'Alt Text',
          type: 'string',
          description: 'Alternative text for accessibility',
          initialValue: 'Godot Tekko Logo'
        }
      ]
    }),

    // Branding Colors
    defineField({
      name: 'branding',
      title: 'Brand Colors',
      type: 'object',
      fields: [
        {
          name: 'primaryColor',
          title: 'Primary Color',
          type: 'color',
          description: 'Main brand color',
          options: {
            disableAlpha: true
          }
        },
        {
          name: 'secondaryColor',
          title: 'Secondary Color',
          type: 'color',
          description: 'Secondary brand color',
          options: {
            disableAlpha: true
          }
        },
        {
          name: 'accentColor',
          title: 'Accent Color',
          type: 'color',
          description: 'Accent/highlight color',
          options: {
            disableAlpha: true
          }
        }
      ]
    }),

    // Site Information
    defineField({
      name: 'siteInfo',
      title: 'Site Information',
      type: 'object',
      fields: [
        {
          name: 'siteName',
          title: 'Site Name',
          type: 'string',
          initialValue: 'Godot Tekko'
        },
        {
          name: 'tagline',
          title: 'Tagline',
          type: 'string',
          description: 'Short description or slogan',
          initialValue: 'Premium Design & Game Development Marketplace'
        },
        {
          name: 'description',
          title: 'Site Description',
          type: 'text',
          description: 'Longer description for SEO and about sections',
          initialValue: 'Discover premium UI kits, game assets, Godot templates, and design resources at Godot Tekko. Perfect for game developers, designers, and creative professionals.'
        },
        {
          name: 'keywords',
          title: 'SEO Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Keywords for SEO'
        }
      ]
    }),

    // Social Media
    defineField({
      name: 'socialMedia',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter URL',
          type: 'url'
        },
        {
          name: 'github',
          title: 'GitHub URL',
          type: 'url'
        },
        {
          name: 'linkedin',
          title: 'LinkedIn URL',
          type: 'url'
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url'
        },
        {
          name: 'youtube',
          title: 'YouTube URL',
          type: 'url'
        },
        {
          name: 'discord',
          title: 'Discord URL',
          type: 'url'
        }
      ]
    }),

    // Advanced Settings
    defineField({
      name: 'settings',
      title: 'Advanced Settings',
      type: 'object',
      fields: [
        {
          name: 'isActive',
          title: 'Active Configuration',
          type: 'boolean',
          description: 'Set this configuration as active',
          initialValue: true
        },
        {
          name: 'environment',
          title: 'Environment',
          type: 'string',
          options: {
            list: [
              { title: 'Production', value: 'production' },
              { title: 'Staging', value: 'staging' },
              { title: 'Development', value: 'development' }
            ]
          },
          initialValue: 'production'
        },
        {
          name: 'lastModified',
          title: 'Last Modified',
          type: 'datetime',
          initialValue: () => new Date().toISOString()
        },
        {
          name: 'modifiedBy',
          title: 'Modified By',
          type: 'string',
          description: 'User who last modified this configuration'
        }
      ]
    })
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'siteInfo.siteName',
      media: 'logo.logoImage',
      isActive: 'settings.isActive'
    },
    prepare(selection) {
      const { title, subtitle, media, isActive } = selection
      return {
        title: title || 'Site Configuration',
        subtitle: `${subtitle || 'Godot Tekko'} ${isActive ? '✅ Active' : '⭕ Inactive'}`,
        media: media || '🎨'
      }
    }
  },

  orderings: [
    {
      title: 'Last Modified',
      name: 'lastModified',
      by: [{ field: 'settings.lastModified', direction: 'desc' }]
    },
    {
      title: 'Active First',
      name: 'activeFirst',
      by: [
        { field: 'settings.isActive', direction: 'desc' },
        { field: 'settings.lastModified', direction: 'desc' }
      ]
    }
  ]
})
