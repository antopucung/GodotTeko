import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'teacherClass',
  title: 'Teacher Class',
  type: 'document',
  fields: [
    defineField({
      name: 'className',
      title: 'Class Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Class Code',
      type: 'slug',
      options: {
        source: 'className',
        maxLength: 20,
      },
      validation: (Rule) => Rule.required(),
      description: 'Unique code students use to join class'
    }),
    defineField({
      name: 'teacher',
      title: 'Teacher',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Class Description',
      type: 'text',
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'institution',
      title: 'Institution/School',
      type: 'string',
    }),
    defineField({
      name: 'academicYear',
      title: 'Academic Year',
      type: 'string',
      description: 'e.g., 2024-2025'
    }),
    defineField({
      name: 'semester',
      title: 'Semester/Term',
      type: 'string',
      options: {
        list: [
          { title: 'Fall', value: 'fall' },
          { title: 'Spring', value: 'spring' },
          { title: 'Summer', value: 'summer' },
          { title: 'Term 1', value: 'term1' },
          { title: 'Term 2', value: 'term2' },
          { title: 'Term 3', value: 'term3' },
          { title: 'Full Year', value: 'full_year' }
        ]
      }
    }),
    defineField({
      name: 'schedule',
      title: 'Class Schedule',
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
          name: 'meetingDays',
          title: 'Meeting Days',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Monday', value: 'monday' },
              { title: 'Tuesday', value: 'tuesday' },
              { title: 'Wednesday', value: 'wednesday' },
              { title: 'Thursday', value: 'thursday' },
              { title: 'Friday', value: 'friday' },
              { title: 'Saturday', value: 'saturday' },
              { title: 'Sunday', value: 'sunday' }
            ]
          }
        }),
        defineField({
          name: 'meetingTime',
          title: 'Meeting Time',
          type: 'string',
          description: 'e.g., 10:00 AM - 11:30 AM'
        }),
        defineField({
          name: 'timezone',
          title: 'Timezone',
          type: 'string',
          initialValue: 'UTC'
        })
      ]
    }),
    defineField({
      name: 'enrolledStudents',
      title: 'Enrolled Students',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'student',
              title: 'Student',
              type: 'reference',
              to: [{ type: 'user' }],
            }),
            defineField({
              name: 'enrollmentDate',
              title: 'Enrollment Date',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
            }),
            defineField({
              name: 'status',
              title: 'Enrollment Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Active', value: 'active' },
                  { title: 'Inactive', value: 'inactive' },
                  { title: 'Dropped', value: 'dropped' },
                  { title: 'Suspended', value: 'suspended' }
                ]
              },
              initialValue: 'active',
            }),
            defineField({
              name: 'studentId',
              title: 'Student ID',
              type: 'string',
              description: 'School-specific student identifier'
            }),
            defineField({
              name: 'notes',
              title: 'Teacher Notes',
              type: 'text',
            })
          ],
          preview: {
            select: {
              title: 'student.name',
              subtitle: 'status',
              studentId: 'studentId'
            },
            prepare(selection) {
              const { title, subtitle, studentId } = selection
              return {
                title: title || 'Unknown Student',
                subtitle: `${subtitle?.toUpperCase()} ${studentId ? `• ID: ${studentId}` : ''}`
              }
            }
          }
        }
      ]
    }),
    defineField({
      name: 'assignedCourses',
      title: 'Assigned Courses',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'course',
              title: 'Course',
              type: 'reference',
              to: [{ type: 'course' }],
            }),
            defineField({
              name: 'assignmentDate',
              title: 'Assignment Date',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
            }),
            defineField({
              name: 'dueDate',
              title: 'Completion Due Date',
              type: 'date',
            }),
            defineField({
              name: 'mandatory',
              title: 'Mandatory Course',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'weight',
              title: 'Grade Weight (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
              description: 'Percentage weight in final class grade'
            })
          ],
          preview: {
            select: {
              title: 'course.title',
              dueDate: 'dueDate',
              mandatory: 'mandatory'
            },
            prepare(selection) {
              const { title, dueDate, mandatory } = selection
              return {
                title: title || 'Unknown Course',
                subtitle: `${mandatory ? 'MANDATORY' : 'OPTIONAL'} • Due: ${dueDate || 'No due date'}`
              }
            }
          }
        }
      ]
    }),
    defineField({
      name: 'assessments',
      title: 'Class Assessments',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Assessment Title',
              type: 'string',
            }),
            defineField({
              name: 'type',
              title: 'Assessment Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Quiz', value: 'quiz' },
                  { title: 'Assignment', value: 'assignment' },
                  { title: 'Project', value: 'project' },
                  { title: 'Exam', value: 'exam' },
                  { title: 'Presentation', value: 'presentation' },
                  { title: 'Portfolio', value: 'portfolio' }
                ]
              }
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
            }),
            defineField({
              name: 'assignedDate',
              title: 'Assigned Date',
              type: 'datetime',
            }),
            defineField({
              name: 'dueDate',
              title: 'Due Date',
              type: 'datetime',
            }),
            defineField({
              name: 'maxPoints',
              title: 'Maximum Points',
              type: 'number',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'weight',
              title: 'Grade Weight (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'instructions',
              title: 'Instructions',
              type: 'text',
            }),
            defineField({
              name: 'resourcesUrl',
              title: 'Resources URL',
              type: 'url',
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'gradingPeriods',
      title: 'Grading Periods',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Period Name',
              type: 'string',
              description: 'e.g., Quarter 1, Midterm, Final'
            }),
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
              name: 'weight',
              title: 'Weight in Final Grade (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'classSettings',
      title: 'Class Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'allowSelfEnrollment',
          title: 'Allow Self-Enrollment',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'maxStudents',
          title: 'Maximum Students',
          type: 'number',
          validation: (Rule) => Rule.min(1).max(1000),
        }),
        defineField({
          name: 'enableDiscussions',
          title: 'Enable Class Discussions',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'gradeVisibility',
          title: 'Grade Visibility',
          type: 'string',
          options: {
            list: [
              { title: 'Hidden', value: 'hidden' },
              { title: 'Visible to Students', value: 'visible' },
              { title: 'Visible After Grading Period', value: 'period_end' }
            ]
          },
          initialValue: 'visible',
        }),
        defineField({
          name: 'certificatesEnabled',
          title: 'Enable Certificates',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'passingGrade',
          title: 'Passing Grade (%)',
          type: 'number',
          validation: (Rule) => Rule.min(0).max(100),
          initialValue: 70,
        })
      ]
    }),
    defineField({
      name: 'revenueTracking',
      title: 'Revenue Tracking',
      type: 'object',
      fields: [
        defineField({
          name: 'revenuePerStudent',
          title: 'Revenue per Student',
          type: 'number',
          initialValue: 0,
        }),
        defineField({
          name: 'totalRevenue',
          title: 'Total Class Revenue',
          type: 'number',
          initialValue: 0,
          readOnly: true,
        }),
        defineField({
          name: 'paymentStatus',
          title: 'Payment Status',
          type: 'string',
          options: {
            list: [
              { title: 'Pending', value: 'pending' },
              { title: 'Paid', value: 'paid' },
              { title: 'Partial', value: 'partial' },
              { title: 'Overdue', value: 'overdue' }
            ]
          },
          initialValue: 'pending',
        }),
        defineField({
          name: 'invoiceGenerated',
          title: 'Invoice Generated',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'invoiceDate',
          title: 'Invoice Date',
          type: 'datetime',
        })
      ]
    }),
    defineField({
      name: 'status',
      title: 'Class Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Active', value: 'active' },
          { title: 'Completed', value: 'completed' },
          { title: 'Archived', value: 'archived' },
          { title: 'Cancelled', value: 'cancelled' }
        ]
      },
      initialValue: 'draft',
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
      title: 'className',
      teacher: 'teacher.name',
      studentCount: 'enrolledStudents',
      status: 'status'
    },
    prepare(selection) {
      const { title, teacher, studentCount, status } = selection
      const students = Array.isArray(studentCount) ? studentCount.length : 0
      return {
        title,
        subtitle: `${teacher} • ${students} students • ${status?.toUpperCase()}`
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
      title: 'Class Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'className', direction: 'asc' }]
    },
    {
      title: 'Most Students',
      name: 'studentsDesc',
      by: [{ field: 'enrolledStudents', direction: 'desc' }]
    }
  ]
})
