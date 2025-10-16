const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID for organizing files
 * @returns {String} - S3 file URL
 */
const uploadToS3 = async (file, userId) => {
    try {
        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'private', // Files are private, not publicly accessible
        };

        const result = await s3.upload(params).promise();

        return result.Location; // Returns full S3 URL

    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

/**
 * Delete file from S3
 * @param {String} fileUrl - Full S3 URL
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        // Extract key from URL
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();

    } catch (error) {
        console.error('S3 delete error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

/**
 * Get signed URL for private file access (valid for 1 hour)
 * @param {String} fileUrl - Full S3 URL
 * @returns {String} - Signed URL
 */
const getSignedUrl = async (fileUrl) => {
    try {
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1);

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600 // URL valid for 1 hour
        };

        return s3.getSignedUrl('getObject', params);

    } catch (error) {
        console.error('Get signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
};

module.exports = {
    uploadToS3,
    deleteFromS3,
    getSignedUrl
};
