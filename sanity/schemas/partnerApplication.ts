export default {
  name: 'partnerApplication',
  title: 'Partner Application',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'Applicant',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'status',
      title: 'Application Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending Review', value: 'pending' },
          { title: 'Under Review', value: 'under_review' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' },
          { title: 'On Hold', value: 'on_hold' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'score',
      title: 'Application Score',
      type: 'number',
      description: 'Automated scoring based on application criteria (0-100)',
      validation: (Rule: any) => Rule.min(0).max(100)
    },
    {
      name: 'autoApproved',
      title: 'Auto Approved',
      type: 'boolean',
      description: 'Whether this application was automatically approved'
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'reviewedAt',
      title: 'Reviewed At',
      type: 'datetime'
    },
    {
      name: 'approvedAt',
      title: 'Approved At',
      type: 'datetime'
    },
    {
      name: 'rejectedAt',
      title: 'Rejected At',
      type: 'datetime'
    },
    {
      name: 'reviewedBy',
      title: 'Reviewed By',
      type: 'string',
      description: 'Admin user who reviewed the application'
    },
    {
      name: 'approvedBy',
      title: 'Approved By',
      type: 'string',
      description: 'Admin user who approved the application'
    },

    // Personal Information
    {
      name: 'personalInfo',
      title: 'Personal Information',
      type: 'object',
      fields: [
        {
          name: 'fullName',
          title: 'Full Name',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'email',
          title: 'Email',
          type: 'string',
          validation: (Rule: any) => Rule.required().email()
        },
        {
          name: 'phone',
          title: 'Phone Number',
          type: 'string'
        },
        {
          name: 'location',
          title: 'Location',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'website',
          title: 'Personal Website',
          type: 'url'
        },
        {
          name: 'portfolio',
          title: 'Portfolio URL',
          type: 'url',
          validation: (Rule: any) => Rule.required()
        }
      ]
    },

    // Professional Background
    {
      name: 'professional',
      title: 'Professional Background',
      type: 'object',
      fields: [
        {
          name: 'experience',
          title: 'Experience Level',
          type: 'string',
          options: {
            list: [
              { title: 'Beginner (0-1 years)', value: 'beginner' },
              { title: 'Intermediate (2-4 years)', value: 'intermediate' },
              { title: 'Experienced (5-8 years)', value: 'experienced' },
              { title: 'Expert (8+ years)', value: 'expert' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'specialties',
          title: 'Design Specialties',
          type: 'array',
          of: [{ type: 'string' }],
          validation: (Rule: any) => Rule.required().min(1)
        },
        {
          name: 'previousWork',
          title: 'Previous Work Experience',
          type: 'text'
        },
        {
          name: 'teamSize',
          title: 'Team Size',
          type: 'string',
          options: {
            list: [
              { title: 'Solo designer', value: 'solo' },
              { title: 'Small team (2-5 people)', value: 'small' },
              { title: 'Medium team (6-15 people)', value: 'medium' },
              { title: 'Large team (15+ people)', value: 'large' }
            ]
          }
        },
        {
          name: 'yearsActive',
          title: 'Years Active in Design',
          type: 'number'
        }
      ]
    },

    // Business Information
    {
      name: 'business',
      title: 'Business Information',
      type: 'object',
      fields: [
        {
          name: 'businessType',
          title: 'Business Type',
          type: 'string',
          options: {
            list: [
              { title: 'Freelancer / Individual', value: 'freelancer' },
              { title: 'Design Agency', value: 'agency' },
              { title: 'Design Studio', value: 'studio' },
              { title: 'Startup', value: 'startup' },
              { title: 'Established Company', value: 'company' }
            ]
          },
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'expectedRevenue',
          title: 'Expected Monthly Revenue',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'targetAudience',
          title: 'Target Audience',
          type: 'text'
        },
        {
          name: 'marketingStrategy',
          title: 'Marketing Strategy',
          type: 'text'
        }
      ]
    },

    // Technical Requirements
    {
      name: 'technical',
      title: 'Technical Information',
      type: 'object',
      fields: [
        {
          name: 'designTools',
          title: 'Design Tools',
          type: 'array',
          of: [{ type: 'string' }],
          validation: (Rule: any) => Rule.required().min(1)
        },
        {
          name: 'fileFormats',
          title: 'File Formats',
          type: 'array',
          of: [{ type: 'string' }]
        },
        {
          name: 'qualityStandards',
          title: 'Quality Standards Commitment',
          type: 'boolean',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'originalWork',
          title: 'Original Work Commitment',
          type: 'boolean',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'licensing',
          title: 'Licensing Understanding',
          type: 'boolean'
        }
      ]
    },

    // Agreement
    {
      name: 'agreement',
      title: 'Agreement',
      type: 'object',
      fields: [
        {
          name: 'terms',
          title: 'Terms of Service Accepted',
          type: 'boolean',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'commission',
          title: 'Commission Structure Accepted',
          type: 'boolean',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'quality',
          title: 'Quality Commitment',
          type: 'boolean',
          validation: (Rule: any) => Rule.required()
        },
        {
          name: 'exclusivity',
          title: 'Exclusivity Understanding',
          type: 'boolean'
        }
      ]
    },

    // Review Information
    {
      name: 'reviewNotes',
      title: 'Review Notes',
      type: 'text',
      description: 'Internal notes from the review process'
    },
    {
      name: 'rejectionReason',
      title: 'Rejection Reason',
      type: 'text',
      description: 'Reason for rejection (if applicable)'
    },
    {
      name: 'feedback',
      title: 'Feedback for Applicant',
      type: 'text',
      description: 'Feedback provided to the applicant'
    },
    {
      name: 'flagged',
      title: 'Flagged for Review',
      type: 'boolean',
      description: 'Flag application for special attention'
    },
    {
      name: 'priority',
      title: 'Priority',
      type: 'string',
      options: {
        list: [
          { title: 'Low', value: 'low' },
          { title: 'Normal', value: 'normal' },
          { title: 'High', value: 'high' },
          { title: 'Urgent', value: 'urgent' }
        ]
      },
      initialValue: 'normal'
    }
  ],
  preview: {
    select: {
      title: 'personalInfo.fullName',
      subtitle: 'status',
      score: 'score',
      submittedAt: 'submittedAt'
    },
    prepare(selection: any) {
      const { title, subtitle, score, submittedAt } = selection
      return {
        title: title || 'Partner Application',
        subtitle: `${subtitle} • Score: ${score || 'N/A'} • ${new Date(submittedAt).toLocaleDateString()}`
      }
    }
  },
  orderings: [
    {
      title: 'Submitted Date (Newest First)',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }]
    },
    {
      title: 'Score (Highest First)',
      name: 'scoreDesc',
      by: [{ field: 'score', direction: 'desc' }]
    }
  ]
}
