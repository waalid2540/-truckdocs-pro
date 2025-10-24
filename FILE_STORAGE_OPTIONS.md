# FreightHub Pro - File Storage Options

## Quick Answer: Do You Need AWS?

**NO, you have 3 options:**

1. ✅ **AWS S3** (Current implementation - Recommended for production)
2. ✅ **Render Disk** (Free alternative - Good for testing)
3. ✅ **Cloudflare R2** (Cheapest - S3-compatible)

---

## Option 1: AWS S3 (Recommended) ⭐

### Why Choose AWS S3?
- ✅ Already implemented in your code
- ✅ Industry standard (99.999999999% durability)
- ✅ Free tier: 5GB storage + 20,000 GET requests/month
- ✅ Scales automatically
- ✅ Fast global CDN
- ✅ Easy to set up

### Cost:
- **Free tier**: First 12 months - 5GB storage, 20k GET, 2k PUT requests/month
- **After free tier**: ~$0.023/GB/month (~$0.50/month for 20GB)
- **For 100 users**: ~$2-5/month
- **For 1000 users**: ~$10-20/month

### Setup (10 minutes):

#### 1. Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Enter email, password, account name
4. Add payment method (won't charge in free tier)
5. Complete verification

#### 2. Create S3 Bucket
1. Login to AWS Console
2. Search for "S3" in top search bar
3. Click "Create bucket"
4. Settings:
   - **Bucket name**: `freighthub-documents` (must be globally unique)
   - **Region**: `US East (N. Virginia)` or closest to you
   - **Block all public access**: ✅ YES (keep checked)
   - **Bucket Versioning**: Disabled
   - **Default encryption**: Amazon S3 managed keys (SSE-S3)
5. Click "Create bucket"

#### 3. Create IAM User (for API access)
1. In AWS Console, search "IAM"
2. Click "Users" → "Create user"
3. User name: `freighthub-uploader`
4. Click "Next"
5. Permissions: Click "Attach policies directly"
6. Search for: `AmazonS3FullAccess`
7. Check the box next to it
8. Click "Next" → "Create user"

#### 4. Create Access Keys
1. Click on the user you just created
2. Click "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Select "Application running on AWS compute service"
6. Check "I understand..." → Click "Next"
7. Click "Create access key"
8. **IMPORTANT**: Copy both:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (long random string)
9. Save them securely (you can't see secret key again!)

#### 5. Add to Render Environment Variables

Backend service → Environment → Add:

```env
AWS_ACCESS_KEY_ID=AKIA...your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=freighthub-documents
```

Save (triggers redeploy).

#### 6. Test Document Upload

1. Go to your app
2. Login
3. Try uploading a document (receipt, invoice, etc.)
4. Should succeed!
5. Check AWS S3 bucket - you'll see the file

**Done! ✅ Your documents are now stored in AWS S3.**

---

## Option 2: Render Disk Storage (Free Alternative)

### Why Choose Render Disk?
- ✅ FREE (included in Render plan)
- ✅ No AWS account needed
- ✅ Simple setup
- ❌ Not as durable as S3
- ❌ Limited to one region
- ❌ Max 1GB free (or $0.25/GB/month)

### Cost:
- **Free**: 1GB included
- **Paid**: $0.25/GB/month
- **For 100 users**: ~$5/month (20GB)
- **For 1000 users**: ~$50/month (200GB)

### Setup (15 minutes):

#### 1. Create Render Disk

1. Go to Render Dashboard
2. Click "Disks" in sidebar
3. Click "New Disk"
4. Settings:
   - **Name**: `freighthub-documents`
   - **Mount Path**: `/app/uploads`
   - **Size**: 1GB (free) or more
5. Click "Create"

#### 2. Attach Disk to Backend Service

1. Go to your backend service
2. Click "Disks" tab
3. Click "Add Disk"
4. Select `freighthub-documents`
5. Mount path: `/app/uploads`
6. Save

#### 3. Replace File Upload Code

Create new file: `backend/utils/fileUpload-local.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

// Ensure upload directory exists
const ensureUploadDir = async (userId) => {
    const userDir = path.join(UPLOAD_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
};

/**
 * Upload file to local disk
 */
const uploadToS3 = async (file, userId) => {
    try {
        const userDir = await ensureUploadDir(userId);

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = path.join(userDir, fileName);

        // Write file to disk
        await fs.writeFile(filePath, file.buffer);

        // Return URL-like path (for consistency with S3)
        return `/uploads/${userId}/${fileName}`;

    } catch (error) {
        console.error('File upload error:', error);
        throw new Error('Failed to upload file');
    }
};

/**
 * Delete file from local disk
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        // Convert URL to file path
        const filePath = path.join(UPLOAD_DIR, fileUrl.replace('/uploads/', ''));
        await fs.unlink(filePath);
    } catch (error) {
        console.error('File delete error:', error);
        throw new Error('Failed to delete file');
    }
};

/**
 * Get file (no signed URL needed for local files)
 */
const getSignedUrl = async (fileUrl) => {
    // For local files, just return the path
    return fileUrl;
};

module.exports = {
    uploadToS3,
    deleteFromS3,
    getSignedUrl
};
```

#### 4. Serve Uploaded Files

In `backend/server.js`, add BEFORE other routes:

```javascript
const express = require('express');
const path = require('path');

// Serve uploaded files (protected by auth)
app.use('/uploads', authenticate, express.static('/app/uploads'));
```

#### 5. Update Environment Variable

```env
UPLOAD_DIR=/app/uploads
```

#### 6. Update Import in documents.js

Change line 6 in `backend/routes/documents.js`:

```javascript
// OLD:
const { uploadToS3, deleteFromS3 } = require('../utils/fileUpload');

// NEW:
const { uploadToS3, deleteFromS3 } = require('../utils/fileUpload-local');
```

**Done! ✅ Documents now stored on Render Disk**

---

## Option 3: Cloudflare R2 (Cheapest Long-term)

### Why Choose Cloudflare R2?
- ✅ S3-compatible (same code works!)
- ✅ **No egress fees** (FREE downloads)
- ✅ 10GB free storage
- ✅ Cheaper than AWS after free tier
- ✅ Fast global CDN

### Cost:
- **Free**: 10GB storage, unlimited downloads
- **Paid**: $0.015/GB/month (40% cheaper than S3)
- **For 100 users**: ~$0.30/month (20GB)
- **For 1000 users**: ~$3/month (200GB)

### Setup (Similar to AWS S3):

1. Create Cloudflare account at [cloudflare.com](https://cloudflare.com)
2. Go to R2 Object Storage
3. Create bucket: `freighthub-documents`
4. Create API token
5. Update code to use R2 endpoint:

```javascript
const s3 = new AWS.S3({
    endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
});
```

---

## Comparison Table

| Feature | AWS S3 | Render Disk | Cloudflare R2 |
|---------|--------|-------------|---------------|
| **Free Tier** | 5GB (12 months) | 1GB forever | 10GB forever |
| **Cost (20GB)** | $0.50/month | $5/month | $0.30/month |
| **Cost (200GB)** | $5/month | $50/month | $3/month |
| **Setup Time** | 10 min | 15 min | 10 min |
| **Code Changes** | None ✅ | Some 🟡 | Minimal 🟡 |
| **Durability** | 99.99999% | 99.9% | 99.99999% |
| **Global CDN** | ✅ Yes | ❌ No | ✅ Yes |
| **Best For** | Production | Testing/MVP | Cost-conscious |

---

## My Recommendation

### For You Right Now:

**Start with AWS S3** because:
1. Already implemented (no code changes)
2. Free for first year (5GB is plenty for testing)
3. Easy to set up (10 minutes)
4. Industry standard
5. Scales automatically

### Setup Steps (10 minutes):

1. Create AWS account
2. Create S3 bucket: `freighthub-documents`
3. Create IAM user with S3 access
4. Copy access keys
5. Add to Render environment variables
6. Test document upload

**Total cost during testing**: $0 (free tier)

**After free tier**: ~$2-5/month for 100 users

---

## Testing Without AWS (Quick Start)

If you want to test **right now** without AWS:

### Temporary Local Storage (NOT for production):

1. Create `backend/uploads` folder
2. Add to `.gitignore`:
   ```
   backend/uploads/
   ```

3. Replace `backend/utils/fileUpload.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const uploadToS3 = async (file, userId) => {
    const userDir = path.join(UPLOAD_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });

    const fileName = `${uuidv4()}.${file.originalname.split('.').pop()}`;
    const filePath = path.join(userDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return `/uploads/${userId}/${fileName}`;
};

const deleteFromS3 = async (fileUrl) => {
    const filePath = path.join(UPLOAD_DIR, fileUrl.replace('/uploads/', ''));
    await fs.unlink(filePath);
};

const getSignedUrl = async (fileUrl) => {
    return fileUrl;
};

module.exports = { uploadToS3, deleteFromS3, getSignedUrl };
```

4. In `server.js`, add:
```javascript
app.use('/uploads', authenticate, express.static('uploads'));
```

**This works locally for testing, but files will be DELETED on Render redeploy!**

---

## Production Recommendation

For accepting paying customers:

**Use AWS S3** (or Cloudflare R2 for lower cost)

Why?
- ✅ Files persist forever (even during redeploys)
- ✅ Automatic backups
- ✅ Global CDN (fast downloads worldwide)
- ✅ 99.999999% durability (won't lose files)
- ✅ Scales to millions of users
- ✅ Industry standard

Render Disk is fine for testing, but S3 is better for production.

---

## Next Steps

1. **Choose your option** (I recommend AWS S3)
2. **Follow setup guide** above (10-15 minutes)
3. **Test document upload** in your app
4. **Verify files appear** in S3/Disk
5. **Continue with Stripe setup** from `STRIPE_SETUP.md`

---

## FAQ

**Q: Can I switch from Render Disk to S3 later?**
A: Yes! Just migrate the files and update environment variables.

**Q: What happens to my files if I delete the Render service?**
A: Render Disk files are deleted. S3 files persist.

**Q: Can I use both?**
A: Yes, but not recommended. Pick one.

**Q: Do I need AWS for anything else?**
A: No, just for file storage. Everything else runs on Render.

**Q: Can I use Google Cloud Storage or Azure Blob?**
A: Yes, but requires code changes. S3/R2 work with existing code.

**Q: How do I migrate from local to S3?**
A: Write a script to upload all files from `uploads/` to S3, then update database `file_url` columns.

---

## Support

**AWS S3 Docs**: https://docs.aws.amazon.com/s3/
**Render Disk Docs**: https://render.com/docs/disks
**Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/

---

*Recommendation: Start with AWS S3 (free tier), switch to Cloudflare R2 if cost becomes an issue.*
