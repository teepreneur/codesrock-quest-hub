# YouTube & Cloudinary Integration Guide

## Overview

This document describes the implementation of YouTube video integration for courses and Cloudinary file storage for educational resources in the CodesRock Quest Hub application.

## YouTube Integration (Courses)

### Backend Changes

#### 1. Course Model Updates (`src/models/Course.ts`)

Added YouTube-specific fields:

```typescript
export interface ICourse extends Document {
  youtubeVideoId?: string;      // e.g., "dQw4w9WgXcQ"
  youtubeEmbedUrl?: string;      // Virtual field - computed automatically
  videoUrl: string;              // Now optional for backwards compatibility
}

// Virtual field for embed URL
CourseSchema.virtual('youtubeEmbedUrl').get(function () {
  if (this.youtubeVideoId) {
    return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
  }
  return null;
});
```

**Key Features:**
- `youtubeVideoId`: Stores just the video ID (extracted from YouTube URL)
- `youtubeEmbedUrl`: Auto-generated embed URL using virtual field
- Backwards compatible: `videoUrl` remains for legacy support

#### 2. Updated Seed Data (`src/utils/seedAll.ts`)

All 16 courses now include real educational YouTube video IDs:

**HTML/CSS Courses:**
- HTML Basics for Beginners (UB1O30fR-EE)
- CSS Styling and Layouts (yfoY53QXEnI)
- Advanced CSS Animations (zHUpx90NerM)
- HTML Forms and Validation (fNcJuPIZ2WE)

**JavaScript Courses:**
- JavaScript Fundamentals (PkZNo7MFNFg)
- JavaScript ES6+ Features (NCwa_xi0Uuc)
- DOM Manipulation (y17RuWkWdn8)
- Async JavaScript & Promises (PoRJizFvM7s)

**Computer Science Courses:**
- Computer Science Fundamentals (zOjov-2OZ0E)
- Data Structures & Algorithms (8hly31xKli0)
- Object-Oriented Programming (pTB0EiLXUC8)
- Big O Notation (Mo4vesaut8g)

**Coding Courses:**
- Coding for Beginners (zOjov-2OZ0E)
- Building Your First Website (G3e-cpL7ofc)
- Version Control with Git (RGOj5yH7evk)
- Debugging Techniques (gaminoBsQx0)

Each course includes:
- Title, description, and thumbnail (from YouTube)
- YouTube video ID
- Category, difficulty, and duration
- XP reward and tags

### Frontend Changes

#### 1. YouTube Player Component (`src/components/video/YouTubePlayer.tsx`)

Created a custom YouTube player with features:

**Features:**
- YouTube IFrame API integration
- Real-time progress tracking
- Custom controls (play/pause, mute, fullscreen)
- Progress bar with time display
- Autoplay support
- Completion callback

**Usage:**
```typescript
<YouTubePlayer
  videoId="dQw4w9WgXcQ"
  title="Course Title"
  onProgressUpdate={(watchedSeconds, totalSeconds) => {
    // Update progress every second
  }}
  onComplete={() => {
    // Called when video ends
  }}
  autoplay={false}
  showControls={true}
/>
```

**Props:**
- `videoId` (required): YouTube video ID
- `title` (required): Video title
- `onProgressUpdate` (optional): Callback for progress updates
- `onComplete` (optional): Callback when video ends
- `autoplay` (optional): Auto-play video on load
- `showControls` (optional): Show custom controls overlay

#### 2. Updated Videos Page (`src/pages/Videos.tsx`)

**New Features:**
- Opens YouTube player in a modal dialog
- Real-time progress tracking (updates every 10 seconds)
- Automatic XP rewards on completion
- Shows course details alongside video
- Maintains progress when dialog closes

**Flow:**
1. User clicks "Start" or "Continue" on a course
2. Dialog opens with YouTube player
3. Progress tracked and saved to backend
4. On completion, XP awarded and toast notification shown
5. Course list refreshed to show updated progress

**State Management:**
- `watchingCourse`: Currently playing course
- `isPlayerOpen`: Dialog visibility
- `watchedSeconds`: Current progress in seconds
- `totalSeconds`: Total video duration

## Cloudinary Integration (Resources)

### Backend Changes

#### 1. Resource Model Updates (`src/models/Resource.ts`)

Added Cloudinary-specific fields:

```typescript
export interface IResource extends Document {
  fileUrl: string;                  // Now optional
  cloudinaryUrl?: string;           // Cloudinary secure URL
  cloudinaryPublicId?: string;      // For file management/deletion
  fileSize: number;                 // File size in bytes
}
```

**Key Features:**
- `cloudinaryUrl`: Secure HTTPS URL from Cloudinary
- `cloudinaryPublicId`: Used for file operations (delete, etc.)
- Backwards compatible: `fileUrl` remains for legacy support

#### 2. Cloudinary Configuration (`src/config/cloudinary.ts`)

**Setup:**
```typescript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
```

**Storage Configuration:**
- Automatic folder organization by file type
- Folders: `pdfs/`, `images/`, `documents/`, `presentations/`, `archives/`
- Clean filenames (sanitized, timestamped)

**File Validation:**
- Max size: 10MB
- Allowed types: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG
- MIME type validation

**Helper Functions:**
- `deleteCloudinaryFile(publicId)`: Delete file from Cloudinary
- `getCloudinaryFileInfo(publicId)`: Get file metadata

#### 3. Upload Route (`src/routes/resourceRoutes.ts`)

**Endpoint:** `POST /api/resources/upload`

**Usage:**
```bash
curl -X POST http://localhost:5001/api/resources/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "1234567890-document_pdf",
    "originalName": "document.pdf",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "cloudinaryPublicId": "codesrock/resources/pdfs/1234567890-document_pdf",
    "fileSize": 524288,
    "mimeType": "application/pdf"
  }
}
```

### Environment Variables

Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Get Your Credentials:**
1. Sign up at https://cloudinary.com (free tier: 25GB storage)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Update `.env` with your values
5. Restart backend server

## Folder Structure

### Backend
```
codesrock-backend/
├── src/
│   ├── models/
│   │   ├── Course.ts              (✅ Updated with YouTube fields)
│   │   └── Resource.ts            (✅ Updated with Cloudinary fields)
│   ├── config/
│   │   └── cloudinary.ts          (✅ New - Cloudinary setup)
│   ├── routes/
│   │   └── resourceRoutes.ts      (✅ Updated with upload route)
│   └── utils/
│       └── seedAll.ts             (✅ Updated with YouTube IDs)
├── .env                           (✅ Updated with Cloudinary vars)
└── CLOUDINARY_SETUP.md            (✅ Setup guide)
```

### Frontend
```
src/
├── components/
│   └── video/
│       └── YouTubePlayer.tsx      (✅ New - YouTube player)
└── pages/
    └── Videos.tsx                 (✅ Updated with player dialog)
```

### Cloudinary Organization
```
codesrock/
└── resources/
    ├── pdfs/           # PDF files
    ├── images/         # JPG, PNG images
    ├── documents/      # DOC, DOCX files
    ├── presentations/  # PPT, PPTX files
    └── archives/       # ZIP files
```

## Testing

### YouTube Integration

1. **Reseed Database:**
   ```bash
   cd codesrock-backend
   npm run seed:all
   ```

2. **Start Backend:**
   ```bash
   npm run dev
   ```

3. **Test Frontend:**
   - Navigate to Videos page
   - Click "Start" on any course
   - Video should open in dialog with YouTube player
   - Progress should update in real-time
   - Complete video to earn XP

### Cloudinary Integration

1. **Add Credentials to `.env`**

2. **Test Upload:**
   ```bash
   curl -X POST http://localhost:5001/api/resources/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test.pdf"
   ```

3. **Verify in Cloudinary Dashboard:**
   - Go to Media Library
   - Check `codesrock/resources/pdfs/` folder
   - File should appear with secure URL

## Migration Notes

### Existing Data

Both integrations are **backwards compatible**:

- **Courses:** Old courses without `youtubeVideoId` will still work
- **Resources:** Old resources without `cloudinaryUrl` will still work

No database migration required. New fields are optional.

### Adding YouTube IDs to Existing Courses

Update course documents:

```javascript
await Course.updateOne(
  { title: 'HTML Basics' },
  {
    $set: {
      youtubeVideoId: 'UB1O30fR-EE',
      thumbnail: 'https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg'
    }
  }
);
```

### Migrating Files to Cloudinary

For existing resources with local files:

1. Upload file to Cloudinary using upload route
2. Update resource document with `cloudinaryUrl` and `cloudinaryPublicId`
3. Optionally remove old `fileUrl`

## Security

### YouTube
- Videos are embedded using YouTube's IFrame API
- No API key required for public videos
- Safe for production use

### Cloudinary
- API credentials stored in `.env` (not in git)
- Secure HTTPS URLs for all uploads
- File type and size validation
- 10MB file size limit (configurable)

## Troubleshooting

### YouTube Player Not Loading

**Issue:** Player shows blank screen

**Solutions:**
- Check browser console for errors
- Verify `youtubeVideoId` is correct
- Ensure YouTube IFrame API script loads
- Check for ad blockers blocking YouTube

### Cloudinary Upload Fails

**Issue:** "Invalid credentials" error

**Solutions:**
- Check `.env` has correct credentials (no extra spaces)
- Restart backend after updating `.env`
- Verify credentials in Cloudinary dashboard
- Check Cloudinary account is active (not suspended)

**Issue:** "File type not allowed"

**Solutions:**
- Only these types allowed: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG
- Check file extension matches actual file type
- Verify MIME type is correct

**Issue:** "File too large"

**Solutions:**
- Current limit: 10MB
- Compress file before upload
- Or update limit in `src/config/cloudinary.ts` (line 62)

## Next Steps

### Enhancements

1. **YouTube Player:**
   - Add playback speed control
   - Subtitle/caption support
   - Watch later / bookmarks
   - Video quality selector

2. **Cloudinary:**
   - Drag-and-drop upload UI
   - Bulk file upload
   - File preview before upload
   - Download statistics

3. **Admin Panel:**
   - Upload resources via admin UI
   - Add YouTube videos to courses
   - Manage uploaded files
   - View upload history

## Support

- YouTube IFrame API Docs: https://developers.google.com/youtube/iframe_api_reference
- Cloudinary Docs: https://cloudinary.com/documentation
- Multer Docs: https://github.com/expressjs/multer

## Summary

The integration adds:

**YouTube (Videos):**
- 16 courses with real educational content
- Custom YouTube player with progress tracking
- Automatic XP rewards on completion
- Modal video player with course details

**Cloudinary (Resources):**
- Secure file upload and storage
- Organized folder structure by file type
- File validation and size limits
- Easy file management

Both integrations are production-ready and tested.
