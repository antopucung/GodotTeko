import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'studentProgress',
  title: 'Student Progress',
  type: 'document',
  fields: [
    defineField({
      name: 'student',
      title: 'Student',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'teacher',
      title: 'Teacher',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Teacher who assigned this course'
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
          { title: 'Enrolled', value: 'enrolled' },
          { title: 'In Progress', value: 'in_progress' },
          { title: 'Completed', value: 'completed' },
          { title: 'Dropped', value: 'dropped' },
          { title: 'Suspended', value: 'suspended' }
        ]
      },
      initialValue: 'enrolled',
    }),
    defineField({
      name: 'overallProgress',
      title: 'Overall Progress (%)',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'lessonProgress',
      title: 'Lesson Progress',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'lessonIndex',
              title: 'Lesson Index',
              type: 'number',
              description: 'Index of lesson in course'
            }),
            defineField({
              name: 'lessonTitle',
              title: 'Lesson Title',
              type: 'string',
            }),
            defineField({
              name: 'status',
              title: 'Lesson Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Not Started', value: 'not_started' },
                  { title: 'In Progress', value: 'in_progress' },
                  { title: 'Completed', value: 'completed' },
                  { title: 'Skipped', value: 'skipped' }
                ]
              },
              initialValue: 'not_started',
            }),
            defineField({
              name: 'completionDate',
              title: 'Completion Date',
              type: 'datetime',
            }),
            defineField({
              name: 'timeSpent',
              title: 'Time Spent (minutes)',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'quizScore',
              title: 'Quiz Score (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'quizAttempts',
              title: 'Quiz Attempts',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'notes',
              title: 'Student Notes',
              type: 'text',
            })
          ],
          preview: {
            select: {
              title: 'lessonTitle',
              subtitle: 'status'
            }
          }
        }
      ]
    }),
    defineField({
      name: 'assignments',
      title: 'Assignment Submissions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'assignmentTitle',
              title: 'Assignment Title',
              type: 'string',
            }),
            defineField({
              name: 'submissionDate',
              title: 'Submission Date',
              type: 'datetime',
            }),
            defineField({
              name: 'fileUrl',
              title: 'Submission File URL',
              type: 'url',
            }),
            defineField({
              name: 'description',
              title: 'Submission Description',
              type: 'text',
            }),
            defineField({
              name: 'grade',
              title: 'Grade (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'feedback',
              title: 'Teacher Feedback',
              type: 'text',
            }),
            defineField({
              name: 'gradedDate',
              title: 'Graded Date',
              type: 'datetime',
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'examResults',
      title: 'Exam Results',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'examTitle',
              title: 'Exam Title',
              type: 'string',
            }),
            defineField({
              name: 'examDate',
              title: 'Exam Date',
              type: 'datetime',
            }),
            defineField({
              name: 'score',
              title: 'Score (%)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'timeSpent',
              title: 'Time Spent (minutes)',
              type: 'number',
            }),
            defineField({
              name: 'passed',
              title: 'Passed',
              type: 'boolean',
            }),
            defineField({
              name: 'attempts',
              title: 'Attempt Number',
              type: 'number',
              initialValue: 1,
            }),
            defineField({
              name: 'answers',
              title: 'Detailed Answers',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'questionIndex',
                      title: 'Question Index',
                      type: 'number',
                    }),
                    defineField({
                      name: 'selectedAnswer',
                      title: 'Selected Answer',
                      type: 'number',
                    }),
                    defineField({
                      name: 'correct',
                      title: 'Correct Answer',
                      type: 'boolean',
                    }),
                    defineField({
                      name: 'timeSpent',
                      title: 'Time on Question (seconds)',
                      type: 'number',
                    })
                  ]
                }
              ]
            })
          ]
        }
      ]
    }),
    defineField({
      name: 'certificateIssued',
      title: 'Certificate Issued',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'certificateDate',
      title: 'Certificate Issue Date',
      type: 'datetime',
    }),
    defineField({
      name: 'certificateId',
      title: 'Certificate ID',
      type: 'string',
      description: 'Unique certificate identifier'
    }),
    defineField({
      name: 'finalGrade',
      title: 'Final Grade (%)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'totalTimeSpent',
      title: 'Total Time Spent (hours)',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'completionDate',
      title: 'Course Completion Date',
      type: 'datetime',
    }),
    defineField({
      name: 'teacherComments',
      title: 'Teacher Comments',
      type: 'text',
      description: 'Overall comments from teacher'
    }),
    defineField({
      name: 'lastActivity',
      title: 'Last Activity',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    })
  ],
  preview: {
    select: {
      studentName: 'student.name',
      courseTitle: 'course.title',
      progress: 'overallProgress',
      status: 'status'
    },
    prepare(selection) {
      const { studentName, courseTitle, progress, status } = selection
      return {
        title: `${studentName} - ${courseTitle}`,
        subtitle: `${progress}% • ${status.toUpperCase()}`
      }
    }
  },
  orderings: [
    {
      title: 'Last Activity',
      name: 'lastActivityDesc',
      by: [{ field: 'lastActivity', direction: 'desc' }]
    },
    {
      title: 'Progress Descending',
      name: 'progressDesc',
      by: [{ field: 'overallProgress', direction: 'desc' }]
    },
    {
      title: 'Enrollment Date',
      name: 'enrollmentDesc',
      by: [{ field: 'enrollmentDate', direction: 'desc' }]
    }
  ]
})
