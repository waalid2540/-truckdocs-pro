# AWS S3 Upload Fix - Troubleshooting Guide

## Problem Identified

Documents uploaded through frontend weren't appearing in S3 bucket.

**Root Cause**: Environment variable mismatch
- Code was looking for: `AWS_BUCKET_NAME`
- Environment variable set as: `AWS_S3_BUCKET`

## Fix Applied ✅

Updated `backend/utils/fileUpload.js` to use `AWS_S3_BUCKET` everywhere and added detailed logging.

---

## Next Steps

### 1. Wait for Render to Redeploy (2-3 minutes)

Go to your backend service in Render Dashboard and watch the "Events" tab. Wait for "Deploy succeeded" message.

### 2. Run Missing Database Migration

Visit this URL in your browser:
```
https://truckdocs-backend.onrender.com/add-expiration-fields
```

Expected response:
```json
{
  "success": true,
  "message": "Expiration fields migration complete!"
}
```

This fixes all "column expiration_date does not exist" errors.

### 3. Verify AWS Configuration

After redeploy, check backend logs for this message:
```
✅ AWS S3 configured: { region: 'us-east-2', bucket: 'freighthub-documents' }
```

If you see this warning instead:
```
⚠️  WARNING: AWS S3 credentials not fully configured
```

Then one of these environment variables is missing in Render:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`

### 4. Test Document Upload

1. Go to your frontend: `https://truckdocs-frontend.onrender.com`
2. Login to your account
3. Go to Documents page
4. Click "Upload Document" or "Add Receipt"
5. Fill in details and upload a test image/PDF
6. Click Submit

### 5. Check Backend Logs

After upload, you should see these logs:
```
📤 Starting S3 upload for user 123, file: test-receipt.jpg
📦 Uploading to bucket: freighthub-documents, key: 123/abc-123.jpg
✅ S3 upload successful: https://s3.us-east-2.amazonaws.com/freighthub-documents/123/abc-123.jpg
```

### 6. Verify in S3 Bucket

1. Go to AWS Console → S3
2. Click on `freighthub-documents` bucket
3. You should see a folder with your user ID
4. Inside that folder, you'll see the uploaded file

---

## If Upload Still Fails

### Check AWS Environment Variables

In Render Backend Service → Environment tab, verify you have:

```env
AWS_ACCESS_KEY_ID=AKIA...your_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-2
AWS_S3_BUCKET=freighthub-documents
```

**Common mistakes:**
- ❌ Using `AWS_BUCKET_NAME` (old, incorrect)
- ✅ Using `AWS_S3_BUCKET` (new, correct)
- ❌ Bucket name has typo
- ❌ Region mismatch (code expects us-east-2 if you chose Ohio)

### Check AWS IAM Permissions

Your IAM user needs these permissions:
- `s3:PutObject` (upload files)
- `s3:GetObject` (download files)
- `s3:DeleteObject` (delete files)

The `AmazonS3FullAccess` policy includes all of these.

### Check S3 Bucket Permissions

1. Go to AWS S3 Console
2. Click on `freighthub-documents`
3. Go to "Permissions" tab
4. Check "Block public access" settings (should be ON - that's correct)
5. The bucket should NOT be publicly accessible (files are private)

### Test AWS Credentials Manually

You can test if your AWS credentials work by adding a test endpoint.

In `backend/server.js`, add this temporary route:

```javascript
app.get('/test-s3', async (req, res) => {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
    });

    try {
        const result = await s3.listBuckets().promise();
        res.json({
            success: true,
            message: 'AWS credentials work!',
            buckets: result.Buckets.map(b => b.Name)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

Visit: `https://truckdocs-backend.onrender.com/test-s3`

If it lists your buckets, AWS is configured correctly.

---

## Error Messages & Solutions

### "Access Denied"
**Cause**: IAM user doesn't have permission
**Fix**: Attach `AmazonS3FullAccess` policy to IAM user

### "The specified bucket does not exist"
**Cause**: Bucket name is wrong or in different region
**Fix**: Double-check bucket name matches environment variable

### "SignatureDoesNotMatch"
**Cause**: AWS secret key is incorrect
**Fix**: Regenerate access keys in AWS IAM and update Render

### "No file provided"
**Cause**: Frontend not sending file correctly
**Fix**: Check frontend upload form and axios request

### No error, but file not in S3
**Cause**: Upload might be succeeding but file saved with wrong key
**Fix**: Check logs for actual S3 key being used

---

## Success Indicators

✅ Render redeploy succeeded
✅ Migration ran successfully (expiration_date error gone)
✅ Backend logs show "AWS S3 configured"
✅ Upload logs show "S3 upload successful"
✅ File appears in S3 bucket
✅ Document shows in frontend Documents page

---

## Still Having Issues?

Check backend logs for the EXACT error message:
```bash
# In Render Dashboard:
1. Go to backend service
2. Click "Logs" tab
3. Click "Show logs from" → "1 hour ago"
4. Try uploading again
5. Look for red ❌ error messages
```

The detailed logging I added will show exactly what's happening at each step of the S3 upload process.

---

*Last Updated: 2025-10-24*
*Fix committed: db0a313*
