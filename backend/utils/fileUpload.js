const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Validate AWS configuration on startup
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    console.warn('⚠️  WARNING: AWS S3 credentials not fully configured. File uploads will fail!');
    console.warn('   Missing:', {
        AWS_ACCESS_KEY_ID: !process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !process.env.AWS_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET: !process.env.AWS_S3_BUCKET
    });
} else {
    console.log('✅ AWS S3 configured:', {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET
    });
}

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID for organizing files
 * @returns {String} - S3 file URL
 */
const uploadToS3 = async (file, userId) => {
    try {
        console.log(`📤 Starting S3 upload for user ${userId}, file: ${file.originalname}`);

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'private', // Files are private, not publicly accessible
        };

        console.log(`📦 Uploading to bucket: ${params.Bucket}, key: ${params.Key}`);

        const result = await s3.upload(params).promise();

        console.log(`✅ S3 upload successful: ${result.Location}`);
        return result.Location; // Returns full S3 URL

    } catch (error) {
        console.error('❌ S3 upload error:', error.message);
        console.error('   Bucket:', process.env.AWS_S3_BUCKET);
        console.error('   Region:', process.env.AWS_REGION);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
};

/**
 * Delete file from S3
 * @param {String} fileUrl - Full S3 URL
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        console.log(`🗑️  Deleting file from S3: ${fileUrl}`);

        // Extract key from URL
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log(`✅ S3 delete successful: ${key}`);

    } catch (error) {
        console.error('❌ S3 delete error:', error.message);
        throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
};

/**
 * Get signed URL for private file access (valid for 1 hour)
 * @param {String} fileUrl - Full S3 URL
 * @param {String} filename - Optional filename for download
 * @param {Boolean} forceDownload - Force download instead of opening in browser
 * @returns {String} - Signed URL
 */
const getSignedUrl = async (fileUrl, filename = null, forceDownload = false) => {
    try {
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1);

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Expires: 3600 // URL valid for 1 hour
        };

        // Force download with proper filename
        if (forceDownload && filename) {
            params.ResponseContentDisposition = `attachment; filename="${filename}"`;
        }

        return s3.getSignedUrl('getObject', params);

    } catch (error) {
        console.error('❌ Get signed URL error:', error.message);
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
};

module.exports = {
    uploadToS3,
    deleteFromS3,
    getSignedUrl
};
