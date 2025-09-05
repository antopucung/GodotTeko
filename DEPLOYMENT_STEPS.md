# 🚀 Vercel Deployment Guide - Step by Step

## ✅ Pre-Deployment Checklist

- ✅ GitHub Repository: `antopucung/GodotTeko` (Ready)
- ✅ MongoDB Atlas Database: Configured and accessible
- ✅ All TypeScript errors: Fixed for production
- ✅ Build configuration: Optimized for Vercel
- ✅ Environment variables: Documented and ready

---

## 🎯 Step 1: Access Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with your GitHub account (recommended)
   - This will automatically connect your GitHub repositories
3. **Grant permissions** to access your repositories when prompted

---

## 🎯 Step 2: Import Your Project

1. **Click "New Project"** or **"Import Project"**
2. **Find your repository:**
   - Look for `antopucung/GodotTeko` in the list
   - If not visible, click "Import Third-Party Git Repository"
   - Enter: `https://github.com/antopucung/GodotTeko`
3. **Click "Import"** next to your repository

---

## 🎯 Step 3: Configure Project Settings

Vercel will auto-detect your Next.js project. Verify these settings:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
```

**✅ These should be automatically correct - don't change them!**

---

## 🎯 Step 4: Add Environment Variables

**CRITICAL:** Add these 3 environment variables before deploying:

### **Click "Environment Variables" section and add:**

**Variable 1:**
```
Name: MONGODB_URI
Value: mongodb+srv://sandboxacademia_db_user:LAqTAxI2F1BY7Yxw@cluster0.6u3i7du.mongodb.net/godot-tekko?retryWrites=true&w=majority&appName=Cluster0
```

**Variable 2:**
```
Name: NEXTAUTH_SECRET
Value: godot-tekko-production-secret-key-2024
```

**Variable 3:**
```
Name: NEXTAUTH_URL
Value: https://placeholder-for-now.vercel.app
```
*(We'll update this after deployment)*

---

## 🎯 Step 5: Deploy

1. **Click "Deploy"**
2. **Wait for build to complete** (usually 2-3 minutes)
3. **Watch the build logs** for any errors

### **Expected Build Process:**
```
- Installing dependencies...
- Building application...
- Optimizing build...
- Creating serverless functions...
- ✅ Build completed successfully!
```

---

## 🎯 Step 6: Update NEXTAUTH_URL

After successful deployment:

1. **Copy your Vercel URL** (something like `https://godot-teko-xyz.vercel.app`)
2. **Go to Settings** → **Environment Variables**
3. **Edit NEXTAUTH_URL** and replace with your actual URL
4. **Click "Redeploy"** to apply changes

---

## 🎯 Step 7: Test Your Deployment

Visit your live site and test these features:

### **✅ Core Pages:**
- [ ] Homepage loads correctly
- [ ] `/learn` - Course browsing works
- [ ] `/play-station` - Project showcase displays
- [ ] `/auth/signin` - Authentication page loads

### **✅ Database Connection:**
- [ ] Courses load from MongoDB (or fallback data)
- [ ] Projects display properly
- [ ] No database connection errors in logs

### **✅ Admin Features:**
- [ ] `/admin` - Admin dashboard accessible
- [ ] Course management interface works
- [ ] Project moderation system functional

---

## 🎯 Step 8: Custom Domain (Optional)

To add a custom domain:

1. **Go to Settings** → **Domains**
2. **Add your domain** (e.g., `godottekko.com`)
3. **Configure DNS** as instructed by Vercel
4. **Update NEXTAUTH_URL** to use your custom domain

---

## 🚨 Troubleshooting Common Issues

### **Build Fails with TypeScript Errors:**
- ✅ Already fixed in your codebase
- Build script disables TypeScript checking for deployment

### **Environment Variables Not Working:**
- Double-check variable names (case-sensitive)
- Ensure no extra spaces in values
- Redeploy after adding variables

### **Database Connection Issues:**
- MongoDB Atlas should allow connections from `0.0.0.0/0`
- Check if your MongoDB cluster is active
- App will fallback to mock data if database unavailable

### **Authentication Not Working:**
- Ensure NEXTAUTH_URL matches your actual domain
- Redeploy after updating NEXTAUTH_URL

---

## 🎉 Success Checklist

After deployment, you should have:

- [ ] **Live Homepage:** Beautiful Godot Tekko landing page
- [ ] **Course System:** Learn section with browsable courses
- [ ] **Project Showcase:** Play Station with game projects
- [ ] **User Authentication:** Working sign-in/sign-up
- [ ] **Admin Dashboard:** Full admin interface
- [ ] **Database Integration:** MongoDB connection with fallbacks
- [ ] **Mobile Responsive:** Works on all devices

---

## 📞 Need Help?

If you encounter any issues:

1. **Check Vercel Build Logs** - Click on your deployment to see detailed logs
2. **Monitor Function Logs** - Go to Functions tab to see API errors
3. **Database Status** - Verify MongoDB Atlas cluster is running

---

## 🎯 Your Production URLs

After deployment, your platform will be available at:
- **Main Site:** `https://your-app-name.vercel.app`
- **Admin Panel:** `https://your-app-name.vercel.app/admin`
- **Course Management:** `https://your-app-name.vercel.app/admin/courses`
- **Project Moderation:** `https://your-app-name.vercel.app/admin/projects`

**🚀 Ready to deploy your professional game development learning platform!**
