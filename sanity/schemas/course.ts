import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Course Title',
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
      name: 'description',
      title: 'Course Description',
      type: 'text',
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: 'longDescription',
      title: 'Detailed Description',
      type: 'text',
      description: 'Comprehensive course overview'
    }),
    defineField({
      name: 'thumbnail',
      title: 'Course Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Game Development', value: 'game_dev' },
          { title: '3D Modeling', value: '3d_modeling' },
          { title: 'Programming', value: 'programming' },
          { title: 'Animation', value: 'animation' },
          { title: 'UI/UX Design', value: 'ui_ux' },
          { title: 'Digital Art', value: 'digital_art' },
          { title: 'Audio Design', value: 'audio_design' },
          { title: 'Game Design', value: 'game_design' }
        ],
        layout: 'dropdown'
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
          { title: 'Expert', value: 'expert' }
        ],
        layout: 'radio'
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Estimated Duration (hours)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0.5).max(200),
    }),
    defineField({
      name: 'price',
      title: 'Course Price',
      type: 'object',
      fields: [
        defineField({
          name: 'free',
          title: 'Free Course',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'amount',
          title: 'Price Amount',
          type: 'number',
          hidden: ({ parent }) => parent?.free,
          validation: (Rule) => Rule.min(0),
        }),
        defineField({
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [
              { title: 'USD', value: 'usd' },
              { title: 'EUR', value: 'eur' },
              { title: 'GBP', value: 'gbp' }
            ]
          },
          initialValue: 'usd',
          hidden: ({ parent }) => parent?.free,
        })
      ]
    }),
    defineField({
      name: 'accessLevel',
      title: 'Access Level Required',
      type: 'string',
      options: {
        list: [
          { title: 'Free Access', value: 'free' },
          { title: 'Student Plan', value: 'student' },
          { title: 'Individual Plan', value: 'individual' },
          { title: 'Professional Plan', value: 'professional' },
          { title: 'Team Plan', value: 'team' }
        ]
      },
      initialValue: 'free',
    }),
    defineField({
      name: 'lessons',
      title: 'Course Lessons',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Lesson Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Lesson Description',
              type: 'text',
            }),
            defineField({
              name: 'videoUrl',
              title: 'Video URL',
              type: 'url',
            }),
            defineField({
              name: 'duration',
              title: 'Lesson Duration (minutes)',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(180),
            }),
            defineField({
              name: 'content',
              title: 'Lesson Content',
              type: 'text',
              description: 'Text content, markdown supported'
            }),
            defineField({
              name: 'resources',
              title: 'Downloadable Resources',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'title',
                      title: 'Resource Title',
                      type: 'string',
                    }),
                    defineField({
                      name: 'fileUrl',
                      title: 'File URL',
                      type: 'url',
                    }),
                    defineField({
                      name: 'fileSize',
                      title: 'File Size (MB)',
                      type: 'number',
                    })
                  ]
                }
              ]
            }),
            defineField({
              name: 'quiz',
              title: 'Lesson Quiz',
              type: 'object',
              fields: [
                defineField({
                  name: 'questions',
                  title: 'Quiz Questions',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'question',
                          title: 'Question',
                          type: 'string',
                        }),
                        defineField({
                          name: 'options',
                          title: 'Answer Options',
                          type: 'array',
                          of: [{ type: 'string' }],
                        }),
                        defineField({
                          name: 'correctAnswer',
                          title: 'Correct Answer Index',
                          type: 'number',
                          description: 'Index of correct answer (0-based)',
                        })
                      ]
                    }
                  ]
                }),
                defineField({
                  name: 'passingScore',
                  title: 'Passing Score (%)',
                  type: 'number',
                  initialValue: 70,
                  validation: (Rule) => Rule.min(0).max(100),
                })
              ]
            })
          ],
          preview: {
            select: {
              title: 'title',
              duration: 'duration'
            },
            prepare(selection) {
              const { title, duration } = selection
              return {
                title,
                subtitle: `${duration} minutes`
              }
            }
          }
        }
      ]
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'course' }]
        }
      ],
      description: 'Courses that should be completed before this one'
    }),
    defineField({
      name: 'skills',
      title: 'Skills You\'ll Learn',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Key skills students will acquire'
    }),
    defineField({
      name: 'certificate',
      title: 'Certificate Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Certificate Enabled',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'template',
          title: 'Certificate Template',
          type: 'text',
          description: 'HTML template for certificate generation'
        }),
        defineField({
          name: 'completionThreshold',
          title: 'Completion Threshold (%)',
          type: 'number',
          initialValue: 80,
          validation: (Rule) => Rule.min(50).max(100),
        })
      ]
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Featured Course',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'enrollmentCount',
      title: 'Total Enrollments',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'averageRating',
      title: 'Average Rating',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      validation: (Rule) => Rule.min(0).max(5),
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
      instructor: 'instructor.name'
    },
    prepare(selection) {
      const { title, subtitle, instructor } = selection
      return {
        title,
        subtitle: `${subtitle} • by ${instructor}`
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
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }]
    },
    {
      title: 'Most Popular',
      name: 'popularityDesc',
      by: [{ field: 'enrollmentCount', direction: 'desc' }]
    }
  ]
})
