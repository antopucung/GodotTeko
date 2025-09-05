import { mongoose } from '../database'

const LessonSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  videoUrl: { type: String },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  free: { type: Boolean, default: false }
})

const InstructorSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String }
})

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop' },
  instructor: { type: InstructorSchema, required: true },
  duration: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  category: { type: String, required: true },
  rating: { type: Number, default: 0 },
  enrolled: { type: Number, default: 0 },
  price: { type: mongoose.Schema.Types.Mixed, default: 'Free' }, // Can be 'Free' or number
  featured: { type: Boolean, default: false },
  lessons: [LessonSchema],
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Update updatedAt on save
CourseSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema)
