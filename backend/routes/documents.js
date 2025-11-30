const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { uploadToS3, deleteFromS3 } = require('../utils/fileUpload');
const { extractTextFromImage } = require('../utils/ocr');

const router = express.Router();

// Configure multer for file uploads (store in memory temporarily)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs only
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
        }
    }
});

// GET /api/documents - Get all documents for user
router.get('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const { type, category, start_date, end_date, limit = 50, offset = 0 } = req.query;

        let queryText = `
            SELECT id, document_type, title, description, file_url, file_name,
                   file_size, file_type, category, amount, transaction_date,
                   state, vendor_name, is_tax_deductible, tags, created_at
            FROM documents
            WHERE user_id = $1
        `;
        const queryParams = [req.user.id];
        let paramCount = 1;

        // Filter by document type
        if (type) {
            paramCount++;
            queryText += ` AND document_type = $${paramCount}`;
            queryParams.push(type);
        }

        // Filter by category
        if (category) {
            paramCount++;
            queryText += ` AND category = $${paramCount}`;
            queryParams.push(category);
        }

        // Filter by date range
        if (start_date) {
            paramCount++;
            queryText += ` AND transaction_date >= $${paramCount}`;
            queryParams.push(start_date);
        }
        if (end_date) {
            paramCount++;
            queryText += ` AND transaction_date <= $${paramCount}`;
            queryParams.push(end_date);
        }

        queryText += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);

        const result = await query(queryText, queryParams);

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) FROM documents WHERE user_id = $1',
            [req.user.id]
        );

        res.json({
            documents: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            error: 'Failed to get documents',
            message: error.message
        });
    }
});

// POST /api/documents - Upload new document
router.post('/', authenticate, requireSubscription, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided'
            });
        }

        const {
            document_type,
            title,
            description,
            category,
            amount,
            transaction_date,
            state,
            vendor_name,
            is_tax_deductible = true
        } = req.body;

        // Validate required fields
        if (!document_type || !title) {
            return res.status(400).json({
                error: 'document_type and title are required'
            });
        }

        // Upload file to S3
        const fileUrl = await uploadToS3(req.file, req.user.id);

        // Extract text from image using OCR (if image)
        let ocr_text = null;
        if (req.file.mimetype.startsWith('image/')) {
            try {
                ocr_text = await extractTextFromImage(req.file.buffer);
            } catch (ocrError) {
                console.error('OCR error:', ocrError);
                // Continue without OCR if it fails
            }
        }

        // Insert document into database
        const result = await query(
            `INSERT INTO documents (
                user_id, document_type, title, description, file_url, file_name,
                file_size, file_type, ocr_text, category, amount, transaction_date,
                state, vendor_name, is_tax_deductible
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                req.user.id, document_type, title, description, fileUrl,
                req.file.originalname, req.file.size, req.file.mimetype,
                ocr_text, category, amount, transaction_date, state,
                vendor_name, is_tax_deductible
            ]
        );

        // Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'upload_document', 'document', result.rows[0].id]
        );

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            error: 'Failed to upload document',
            message: error.message
        });
    }
});

// GET /api/documents/:id - Get single document
router.get('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            error: 'Failed to get document',
            message: error.message
        });
    }
});

// GET /api/documents/:id/signed-url - Get signed URL for secure file access
router.get('/:id/signed-url', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, file_url, file_name FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        const document = result.rows[0];

        // Generate signed URL (valid for 1 hour)
        const { getSignedUrl } = require('../utils/fileUpload');
        const signedUrl = await getSignedUrl(document.file_url);

        res.json({
            signedUrl,
            filename: document.file_name,
            expiresIn: 3600 // 1 hour in seconds
        });

    } catch (error) {
        console.error('Get signed URL error:', error);
        res.status(500).json({
            error: 'Failed to generate signed URL',
            message: error.message
        });
    }
});

// GET /api/documents/:id/download - Get download URL that forces file download
router.get('/:id/download', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, file_url, file_name FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        const document = result.rows[0];

        // Generate signed URL with forced download
        const { getSignedUrl } = require('../utils/fileUpload');
        const downloadUrl = await getSignedUrl(document.file_url, document.file_name, true);

        res.json({
            downloadUrl,
            filename: document.file_name,
            expiresIn: 3600 // 1 hour in seconds
        });

    } catch (error) {
        console.error('Get download URL error:', error);
        res.status(500).json({
            error: 'Failed to generate download URL',
            message: error.message
        });
    }
});

// PUT /api/documents/:id - Update document
router.put('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            amount,
            transaction_date,
            state,
            vendor_name,
            is_tax_deductible,
            tags
        } = req.body;

        // Check if document exists and belongs to user
        const existing = await query(
            'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        // Update document
        const result = await query(
            `UPDATE documents SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                amount = COALESCE($4, amount),
                transaction_date = COALESCE($5, transaction_date),
                state = COALESCE($6, state),
                vendor_name = COALESCE($7, vendor_name),
                is_tax_deductible = COALESCE($8, is_tax_deductible),
                tags = COALESCE($9, tags),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND user_id = $11
             RETURNING *`,
            [title, description, category, amount, transaction_date, state,
             vendor_name, is_tax_deductible, tags, req.params.id, req.user.id]
        );

        res.json({
            message: 'Document updated successfully',
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({
            error: 'Failed to update document',
            message: error.message
        });
    }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        // Get document to delete file from S3
        const existing = await query(
            'SELECT file_url FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        // Delete from S3
        try {
            await deleteFromS3(existing.rows[0].file_url);
        } catch (s3Error) {
            console.error('S3 delete error:', s3Error);
            // Continue with database deletion even if S3 fails
        }

        // Delete from database
        await query(
            'DELETE FROM documents WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        res.json({
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            error: 'Failed to delete document',
            message: error.message
        });
    }
});

// GET /api/documents/stats/summary - Get document statistics
router.get('/stats/summary', authenticate, requireSubscription, async (req, res) => {
    try {
        const stats = await query(
            `SELECT
                COUNT(*) as total_documents,
                COUNT(DISTINCT document_type) as document_types,
                SUM(file_size) as total_storage,
                COUNT(CASE WHEN transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_uploads
             FROM documents
             WHERE user_id = $1`,
            [req.user.id]
        );

        res.json({
            stats: stats.rows[0]
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

module.exports = router;
