import product from './product'
import category from './category'
import author from './author'
import user from './user'
import review from './review'
import order from './order'
import transaction from './transaction'
import revenueAnalytics from './revenueAnalytics'
import cart from './cart'
import license from './license'
import accessPass from './accessPass'
import partnerAsset from './partnerAsset'
import downloadActivity from './downloadActivity'
import tag from './tag'
import faq from './faq'
import siteSettings from './siteSettings'
import authorApplication from './authorApplication'
import newsletterSubscription from './newsletterSubscription'
import contactSubmission from './contactSubmission'
import userOnboarding from './userOnboarding'
import partnerApplication from './partnerApplication'
import downloadToken from './downloadToken'
import fileUpload from './fileUpload'
import partnerPayout from './partnerPayout'
import taxReport from './taxReport'
import revenueForecast from './revenueForecast'
import emailWorkflow from './emailWorkflow'
import emailTemplate from './emailTemplate'
import emailCampaign from './emailCampaign'
import emailActivity from './emailActivity'
import newsletterPreferences from './newsletterPreferences'
import subscriptionPlan from './subscriptionPlan'
import siteConfiguration from './siteConfiguration'

// Enhanced Learning Platform Schemas
import userEnhanced from './userEnhanced'
import course from './course'
import teacherClass from './teacherClass'
import studentProgress from './studentProgress'
import vipProject from './vipProject'
import gameProject from './gameProject'
import gameStudio from './gameStudio'
import productionLog from './productionLog'
import projectComment from './projectComment'

export const schemaTypes = [
  // Main content types
  product,
  category,
  author,
  user,
  review,
  tag,

  // Commerce & Transactions
  order,
  transaction,
  cart,
  license,
  accessPass,
  subscriptionPlan,

  // Analytics & Reporting
  revenueAnalytics,
  partnerPayout,
  taxReport,
  revenueForecast,

  // Email Automation System
  emailWorkflow,
  emailTemplate,
  emailCampaign,
  emailActivity,
  newsletterPreferences,

  // Partner content
  partnerAsset,

  // Download & File Management
  downloadToken,
  downloadActivity,
  fileUpload,

  // Onboarding & Applications
  userOnboarding,
  partnerApplication,

  // Site management
  siteSettings,
  siteConfiguration,
  faq,

  // Enhanced Learning Platform
  userEnhanced,
  course,
  teacherClass,
  studentProgress,
  vipProject,

  // Play.Station Game Development
  gameProject,
  gameStudio,
  productionLog,
  projectComment,

  // Form submissions
  authorApplication,
  newsletterSubscription,
  contactSubmission,
]
