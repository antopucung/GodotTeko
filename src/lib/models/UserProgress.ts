import { mongoose } from '../database'

const LessonProgressSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 } // in seconds
})

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  enrolledAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  overallProgress: { type: Number, default: 0 }, // percentage 0-100
  lessonsProgress: [LessonProgressSchema],
  certificateIssued: { type: Boolean, default: false },
  certificateDate: { type: Date },
  certificateId: { type: String },
  lastAccessedAt: { type: Date, default: Date.now },
  totalTimeSpent: { type: Number, default: 0 }, // in seconds
  updatedAt: { type: Date, default: Date.now }
})

// Ensure unique user-course combination
UserProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true })

// Update overall progress when lesson progress changes
UserProgressSchema.methods.updateOverallProgress = function() {
  if (this.lessonsProgress && this.lessonsProgress.length > 0) {
    const completedLessons = this.lessonsProgress.filter(lesson => lesson.completed).length
    this.overallProgress = Math.round((completedLessons / this.lessonsProgress.length) * 100)

    // Update status based on progress
    if (this.overallProgress === 100 && this.status !== 'completed') {
      this.status = 'completed'
      this.completedAt = new Date()
    } else if (this.overallProgress > 0 && this.status === 'enrolled') {
      this.status = 'in_progress'
      this.startedAt = new Date()
    }
  }
  this.updatedAt = new Date()
  this.lastAccessedAt = new Date()
}

// Update timestamps on save
UserProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  this.lastAccessedAt = new Date()
  next()
})

export const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema)
