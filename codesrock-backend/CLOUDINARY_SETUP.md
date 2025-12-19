# Cloudinary Setup Guide

## Step 1: Create Free Cloudinary Account

1. Go to https://cloudinary.com
2. Click "Sign Up for Free"
3. Create account with email or social login
4. Verify your email

## Step 2: Get Your Credentials

1. After logging in, go to Dashboard
2. You'll see your credentials:
   - **Cloud Name**: e.g., "dxyz123abc"
   - **API Key**: e.g., "123456789012345"
   - **API Secret**: e.g., "abcdefghijklmnopqrstuvwxyz123"

## Step 3: Update Backend .env File

Add these to `/codesrock-backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example** (replace with your actual values):
```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
```

## Step 4: Test Upload (Optional)

After setting up credentials, restart your backend server:

```bash
cd codesrock-backend
npm run dev
```

The Cloudinary integration is now ready!

## Cloudinary Folder Structure

Resources will be organized automatically:

```
codesrock/
  └── resources/
      ├── pdfs/           # PDF files
      ├── images/         # JPG, PNG images
      ├── documents/      # DOC, DOCX files
      ├── presentations/  # PPT, PPTX files
      └── archives/       # ZIP files
```

## File Upload Limits

- **Max File Size**: 10MB
- **Allowed Types**: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG
- **Free Tier**: 25 GB storage, 25 GB bandwidth/month

## Security

- API credentials are kept in `.env` (not committed to git)
- Files are uploaded to secure URLs
- Cloudinary provides automatic HTTPS

## Troubleshooting

### Upload Fails with "Invalid Credentials"
- Check that you copied credentials correctly (no extra spaces)
- Make sure you added them to `.env` file
- Restart backend server after adding credentials

### "File Type Not Allowed"
- Only these types are allowed: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPG, PNG
- Check file extension matches actual file type

### "File Too Large"
- Current limit is 10MB
- Compress large files before upload
- Or update limit in `src/config/cloudinary.ts`

## Next Steps

Once Cloudinary is set up, you can:
1. Upload resources via admin panel
2. Download resources (URLs provided by Cloudinary)
3. View resources in Resources page
