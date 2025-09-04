import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'userEnhanced',
  title: 'Enhanced User',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'image',
      title: 'Profile Image',
      type: 'url',
    }),
    defineField({
      name: 'role',
      title: 'User Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Partner Studio', value: 'partner' },
          { title: 'Teacher', value: 'teacher' },
          { title: 'Admin', value: 'admin' },
          { title: 'Super Admin', value: 'super_admin' }
        ],
        layout: 'radio'
      },
      initialValue: 'user',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'permissions',
      title: 'Custom Permissions',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Manage Users', value: 'manage_users' },
              { title: 'Create Courses', value: 'create_courses' },
              { title: 'Upload Projects', value: 'upload_projects' },
              { title: 'Access Analytics', value: 'access_analytics' },
              { title: 'Generate Certificates', value: 'generate_certificates' },
              { title: 'Manage Students', value: 'manage_students' },
              { title: 'View Revenue', value: 'view_revenue' },
              { title: 'Moderate Content', value: 'moderate_content' },
              { title: 'System Configuration', value: 'system_config' },
              { title: 'Super Admin Access', value: 'super_admin_access' }
            ]
          }
        }
      ],
      description: 'Additional permissions beyond role defaults'
    }),
    defineField({
      name: 'subscriptionTier',
      title: 'Subscription Tier',
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
    }),
    defineField({
      name: 'subscriptionStatus',
      title: 'Subscription Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Inactive', value: 'inactive' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Trial', value: 'trial' }
        ]
      },
      initialValue: 'inactive',
    }),
    defineField({
      name: 'teacherProfile',
      title: 'Teacher Profile',
      type: 'object',
      hidden: ({ document }) => !['teacher', 'admin', 'super_admin'].includes(document?.role as string),
      fields: [
        defineField({
          name: 'institution',
          title: 'Institution/School',
          type: 'string',
        }),
        defineField({
          name: 'specialization',
          title: 'Teaching Specialization',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Game Development', value: 'game_dev' },
              { title: '3D Modeling', value: '3d_modeling' },
              { title: 'Programming', value: 'programming' },
              { title: 'Animation', value: 'animation' },
              { title: 'UI/UX Design', value: 'ui_ux' },
              { title: 'Digital Art', value: 'digital_art' }
            ]
          }
        }),
        defineField({
          name: 'studentCount',
          title: 'Total Students',
          type: 'number',
          initialValue: 0,
        }),
        defineField({
          name: 'revenueEarned',
          title: 'Total Revenue Earned',
          type: 'number',
          initialValue: 0,
        }),
        defineField({
          name: 'certificationTemplate',
          title: 'Custom Certification Template',
          type: 'text',
          description: 'HTML template for certificates'
        })
      ]
    }),
    defineField({
      name: 'creatorProfile',
      title: 'Creator Profile (Unified Partner + Teacher)',
      type: 'object',
      hidden: ({ document }) => !['partner', 'teacher', 'admin', 'super_admin'].includes(document?.role as string),
      fields: [
        defineField({
          name: 'studioName',
          title: 'Studio/Creator Name',
          type: 'string',
        }),
        defineField({
          name: 'studioDescription',
          title: 'Creator Description',
          type: 'text',
        }),
        defineField({
          name: 'specializations',
          title: 'Specializations',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Game Development', value: 'game_dev' },
              { title: '3D Modeling', value: '3d_modeling' },
              { title: 'Programming', value: 'programming' },
              { title: 'Animation', value: 'animation' },
              { title: 'UI/UX Design', value: 'ui_ux' },
              { title: 'Digital Art', value: 'digital_art' },
              { title: 'Audio Design', value: 'audio_design' },
              { title: 'Environment Art', value: 'environment_art' }
            ]
          }
        }),
        defineField({
          name: 'website',
          title: 'Studio Website',
          type: 'url',
        }),
        defineField({
          name: 'portfolioUrl',
          title: 'Portfolio URL',
          type: 'url',
        }),
        // Content Statistics
        defineField({
          name: 'contentStats',
          title: 'Content Statistics',
          type: 'object',
          fields: [
            defineField({
              name: 'assetsPublished',
              title: 'Assets Published',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'coursesCreated',
              title: 'Courses Created',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'projectsShowcased',
              title: 'Projects Showcased',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'vipSubscribers',
              title: 'VIP Subscribers',
              type: 'number',
              initialValue: 0,
            })
          ]
        }),
        // Revenue Tracking
        defineField({
          name: 'revenueTracking',
          title: 'Revenue Tracking',
          type: 'object',
          fields: [
            defineField({
              name: 'assetRevenue',
              title: 'Asset Revenue',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'courseRevenue',
              title: 'Course Revenue',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'vipRevenue',
              title: 'VIP Revenue',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'totalEarnings',
              title: 'Total Earnings',
              type: 'number',
              initialValue: 0,
            })
          ]
        }),
        // Creator Capabilities
        defineField({
          name: 'creatorCapabilities',
          title: 'Creator Capabilities',
          type: 'object',
          fields: [
            defineField({
              name: 'canCreateAssets',
              title: 'Can Create Assets',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'canCreateCourses',
              title: 'Can Create Courses',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'canCreateProjects',
              title: 'Can Create VIP Projects',
              type: 'boolean',
              initialValue: false,
              description: 'Requires verification'
            }),
            defineField({
              name: 'canCreateVipContent',
              title: 'Can Create VIP Content',
              type: 'boolean',
              initialValue: false,
              description: 'Premium creator feature'
            })
          ]
        }),
        defineField({
          name: 'verified',
          title: 'Verified Creator',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'featured',
          title: 'Featured Creator',
          type: 'boolean',
          initialValue: false,
        })
      ]
    }),
    defineField({
      name: 'lastLogin',
      title: 'Last Login',
      type: 'datetime',
    }),
    defineField({
      name: 'joinedAt',
      title: 'Joined Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image'
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title,
        subtitle: `Role: ${subtitle?.toUpperCase()}`
      }
    }
  }
})
