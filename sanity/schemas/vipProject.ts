import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'vipProject',
  title: 'VIP Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Project Subtitle',
      type: 'string',
      validation: (Rule) => Rule.max(150),
    }),
    defineField({
      name: 'description',
      title: 'Project Description',
      type: 'text',
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: 'longDescription',
      title: 'Detailed Description',
      type: 'text',
      description: 'Comprehensive project overview'
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Square thumbnail for gallery grid'
    }),
    defineField({
      name: 'studio',
      title: 'Studio/Creator',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Project Category',
      type: 'string',
      options: {
        list: [
          { title: 'Game Project', value: 'game' },
          { title: '3D Animation', value: 'animation' },
          { title: 'Short Film', value: 'film' },
          { title: 'Architectural Visualization', value: 'archviz' },
          { title: 'Character Design', value: 'character' },
          { title: 'Environment Art', value: 'environment' },
          { title: 'VFX Project', value: 'vfx' },
          { title: 'Product Visualization', value: 'product' },
          { title: 'Motion Graphics', value: 'motion' },
          { title: 'Concept Art', value: 'concept' }
        ],
        layout: 'dropdown'
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      },
      description: 'Keywords for searchability'
    }),
    defineField({
      name: 'status',
      title: 'Project Status',
      type: 'string',
      options: {
        list: [
          { title: 'In Development', value: 'development' },
          { title: 'Completed', value: 'completed' },
          { title: 'Released', value: 'released' },
          { title: 'On Hold', value: 'on_hold' },
          { title: 'Cancelled', value: 'cancelled' }
        ],
        layout: 'radio'
      },
      initialValue: 'development',
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date',
    }),
    defineField({
      name: 'duration',
      title: 'Project Duration',
      type: 'object',
      fields: [
        defineField({
          name: 'startDate',
          title: 'Start Date',
          type: 'date',
        }),
        defineField({
          name: 'endDate',
          title: 'End Date',
          type: 'date',
        }),
        defineField({
          name: 'estimatedHours',
          title: 'Estimated Hours',
          type: 'number',
        })
      ]
    }),
    defineField({
      name: 'media',
      title: 'Project Media',
      type: 'object',
      fields: [
        defineField({
          name: 'trailer',
          title: 'Trailer Video',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'Video URL',
              type: 'url',
            }),
            defineField({
              name: 'thumbnail',
              title: 'Video Thumbnail',
              type: 'image',
            }),
            defineField({
              name: 'duration',
              title: 'Duration (seconds)',
              type: 'number',
            })
          ]
        }),
        defineField({
          name: 'gallery',
          title: 'Image Gallery',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'image',
                  title: 'Image',
                  type: 'image',
                  options: { hotspot: true },
                }),
                defineField({
                  name: 'caption',
                  title: 'Caption',
                  type: 'string',
                }),
                defineField({
                  name: 'category',
                  title: 'Image Category',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Concept Art', value: 'concept' },
                      { title: 'Work in Progress', value: 'wip' },
                      { title: 'Final Render', value: 'final' },
                      { title: 'Behind the Scenes', value: 'bts' },
                      { title: 'Character Design', value: 'character' },
                      { title: 'Environment', value: 'environment' }
                    ]
                  }
                })
              ],
              preview: {
                select: {
                  title: 'caption',
                  media: 'image'
                }
              }
            }
          ]
        }),
        defineField({
          name: 'downloads',
          title: 'Downloadable Assets',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'title',
                  title: 'Asset Title',
                  type: 'string',
                }),
                defineField({
                  name: 'description',
                  title: 'Asset Description',
                  type: 'text',
                }),
                defineField({
                  name: 'fileUrl',
                  title: 'Download URL',
                  type: 'url',
                }),
                defineField({
                  name: 'fileSize',
                  title: 'File Size (MB)',
                  type: 'number',
                }),
                defineField({
                  name: 'fileType',
                  title: 'File Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Blender File (.blend)', value: 'blend' },
                      { title: 'FBX Model', value: 'fbx' },
                      { title: 'OBJ Model', value: 'obj' },
                      { title: 'Texture Pack', value: 'textures' },
                      { title: 'Source Code', value: 'code' },
                      { title: 'Documentation', value: 'docs' },
                      { title: 'Audio Assets', value: 'audio' }
                    ]
                  }
                }),
                defineField({
                  name: 'accessLevel',
                  title: 'Access Level Required',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Free', value: 'free' },
                      { title: 'Student', value: 'student' },
                      { title: 'Individual', value: 'individual' },
                      { title: 'Professional', value: 'professional' },
                      { title: 'Team', value: 'team' }
                    ]
                  },
                  initialValue: 'free',
                })
              ]
            }
          ]
        })
      ]
    }),
    defineField({
      name: 'technicalSpecs',
      title: 'Technical Specifications',
      type: 'object',
      fields: [
        defineField({
          name: 'software',
          title: 'Software Used',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Blender', value: 'blender' },
              { title: 'Unity', value: 'unity' },
              { title: 'Unreal Engine', value: 'unreal' },
              { title: 'Godot', value: 'godot' },
              { title: 'Maya', value: 'maya' },
              { title: '3ds Max', value: '3dsmax' },
              { title: 'Substance Painter', value: 'substance' },
              { title: 'Photoshop', value: 'photoshop' },
              { title: 'After Effects', value: 'aftereffects' }
            ]
          }
        }),
        defineField({
          name: 'renderEngine',
          title: 'Render Engine',
          type: 'string',
        }),
        defineField({
          name: 'polyCount',
          title: 'Polygon Count',
          type: 'number',
        }),
        defineField({
          name: 'textureResolution',
          title: 'Texture Resolution',
          type: 'string',
        }),
        defineField({
          name: 'targetPlatform',
          title: 'Target Platform',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'PC/Windows', value: 'pc' },
              { title: 'Mac', value: 'mac' },
              { title: 'Linux', value: 'linux' },
              { title: 'Mobile', value: 'mobile' },
              { title: 'Web Browser', value: 'web' },
              { title: 'PlayStation', value: 'playstation' },
              { title: 'Xbox', value: 'xbox' },
              { title: 'Nintendo Switch', value: 'switch' }
            ]
          }
        })
      ]
    }),
    defineField({
      name: 'credits',
      title: 'Project Credits',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Credit Name',
              type: 'string',
            }),
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
            }),
            defineField({
              name: 'user',
              title: 'Platform User',
              type: 'reference',
              to: [{ type: 'user' }],
              description: 'Link to platform user if applicable'
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Project',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'downloadCount',
      title: 'Download Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'likeCount',
      title: 'Like Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'thumbnail',
      studio: 'studio.name'
    },
    prepare(selection) {
      const { title, subtitle, studio } = selection
      return {
        title,
        subtitle: `${subtitle} • by ${studio}`
      }
    }
  },
  orderings: [
    {
      title: 'Created Date, New',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }]
    },
    {
      title: 'Most Popular',
      name: 'popularityDesc',
      by: [{ field: 'viewCount', direction: 'desc' }]
    },
    {
      title: 'Most Downloaded',
      name: 'downloadDesc',
      by: [{ field: 'downloadCount', direction: 'desc' }]
    }
  ]
})
