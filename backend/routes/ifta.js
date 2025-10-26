const express = require('express');
const multer = require('multer');
const { query } = require('../config/database');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { uploadToS3, getSignedUrl } = require('../utils/fileUpload');
const Tesseract = require('tesseract.js');

const router = express.Router();

// Configure multer for receipt image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// POST /api/ifta/scan-and-save - Scan IFTA receipt, save to S3, and create document
router.post('/scan-and-save', authenticate, requireSubscription, upload.single('receiptImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No receipt image provided'
            });
        }

        console.log('Processing IFTA receipt with OCR and S3 upload...');

        // 1. Perform OCR on the receipt
        const ocrResult = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            {
                logger: info => console.log(info)
            }
        );

        const extractedText = ocrResult.data.text;

        // 2. Parse IFTA data from OCR text
        const parsedData = parseIFTAReceipt(extractedText);

        // 3. Upload image to S3
        const fileUrl = await uploadToS3(req.file, req.user.id);

        // 4. Create document record in database
        const documentResult = await query(
            `INSERT INTO documents (
                user_id, document_type, title, file_url, file_name,
                file_size, file_type, ocr_text, category, amount,
                transaction_date, state, vendor_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                req.user.id,
                'ifta',
                `IFTA Receipt - ${parsedData.vendor_name || 'Fuel Purchase'}`,
                fileUrl,
                req.file.originalname,
                req.file.size,
                req.file.mimetype,
                extractedText,
                'fuel',
                parsedData.cost,
                parsedData.purchase_date,
                parsedData.state,
                parsedData.vendor_name
            ]
        );

        const document = documentResult.rows[0];

        // 5. Log activity
        await query(
            'INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
            [req.user.id, 'upload_document', 'document', document.id]
        );

        res.json({
            success: true,
            parsedData,
            document,
            extractedText,
            confidence: ocrResult.data.confidence
        });

    } catch (error) {
        console.error('IFTA scan and save error:', error);
        res.status(500).json({
            error: 'Failed to process receipt',
            message: error.message
        });
    }
});

// Helper function to parse IFTA receipt (reused from ocr-scanner.js logic)
function parseIFTAReceipt(text) {
    const parsedData = {
        gallons: null,
        cost: null,
        price_per_gallon: null,
        purchase_date: null,
        state: null,
        vendor_name: null,
        receipt_number: null
    };

    const upperText = text.toUpperCase();
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Extract GALLONS
    const gallonPatterns = [
        /(?:GALLONS?|GAL|VOLUME)[\s:]*(\d+\.\d{1,3})/i,
        /(\d+\.\d{1,3})\s*(?:GAL|GALLONS?)/i,
        /FUEL\s+(?:SALE|QTY|QUANTITY)[\s:]*(\d+\.\d{1,3})/i
    ];
    for (const pattern of gallonPatterns) {
        const match = text.match(pattern);
        if (match) {
            const gallons = parseFloat(match[1]);
            if (gallons > 0 && gallons < 500) {
                parsedData.gallons = gallons;
                break;
            }
        }
    }

    // Extract COST
    const costPatterns = [
        /(?:TOTAL|FUEL\s+TOTAL|AMOUNT)[\s:$]*(\d+\.\d{2})/i,
        /\$\s*(\d+\.\d{2})/
    ];
    for (const pattern of costPatterns) {
        const match = text.match(pattern);
        if (match) {
            const cost = parseFloat(match[1]);
            if (cost > 0 && cost < 2000) {
                parsedData.cost = cost;
                break;
            }
        }
    }

    // Calculate price per gallon
    if (parsedData.gallons && parsedData.cost) {
        parsedData.price_per_gallon = parseFloat((parsedData.cost / parsedData.gallons).toFixed(3));
    }

    // Extract DATE
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{1,2},?\s+\d{4}/i
    ];
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.purchase_date = match[0];
            break;
        }
    }

    // Extract STATE
    const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;
    const stateMatch = upperText.match(statePattern);
    if (stateMatch) {
        parsedData.state = stateMatch[1];
    }

    // Extract VENDOR
    const knownVendors = [
        "PILOT", "FLYING J", "LOVE'S", "TA", "PETRO", "SHELL", "EXXON",
        "CHEVRON", "BP", "MOBIL", "SUNOCO", "SPEEDWAY", "CIRCLE K"
    ];
    for (const vendor of knownVendors) {
        if (upperText.includes(vendor)) {
            parsedData.vendor_name = vendor;
            break;
        }
    }
    if (!parsedData.vendor_name && lines.length > 0) {
        parsedData.vendor_name = lines[0].trim();
    }

    // Extract RECEIPT NUMBER
    const receiptPatterns = [
        /(?:RECEIPT|TRANS|TRANSACTION)[\s#:]*(\d+)/i,
        /#(\d{4,})/
    ];
    for (const pattern of receiptPatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.receipt_number = match[1];
            break;
        }
    }

    return parsedData;
}

// GET /api/ifta/records - Get all IFTA fuel records with receipt links
router.get('/records', authenticate, requireSubscription, async (req, res) => {
    try {
        const { quarter, year, state } = req.query;

        // JOIN with documents table to get receipt file_url
        let queryText = `
            SELECT
                ifta_records.*,
                documents.file_url as receipt_url,
                documents.file_name as receipt_filename
            FROM ifta_records
            LEFT JOIN documents ON ifta_records.document_id = documents.id
            WHERE ifta_records.user_id = $1
        `;
        const queryParams = [req.user.id];
        let paramCount = 1;

        if (quarter) {
            paramCount++;
            queryText += ` AND ifta_records.quarter = $${paramCount}`;
            queryParams.push(quarter);
        }

        if (year) {
            paramCount++;
            queryText += ` AND ifta_records.year = $${paramCount}`;
            queryParams.push(parseInt(year));
        }

        if (state) {
            paramCount++;
            queryText += ` AND ifta_records.state = $${paramCount}`;
            queryParams.push(state);
        }

        queryText += ' ORDER BY ifta_records.purchase_date DESC';

        const result = await query(queryText, queryParams);

        res.json({
            records: result.rows
        });

    } catch (error) {
        console.error('Get IFTA records error:', error);
        res.status(500).json({
            error: 'Failed to get IFTA records',
            message: error.message
        });
    }
});

// GET /api/ifta/records/:id/receipt-url - Get signed URL for IFTA receipt
router.get('/records/:id/receipt-url', authenticate, requireSubscription, async (req, res) => {
    try {
        // Get IFTA record with document info
        const result = await query(
            `SELECT
                ifta_records.id,
                documents.file_url,
                documents.file_name
             FROM ifta_records
             LEFT JOIN documents ON ifta_records.document_id = documents.id
             WHERE ifta_records.id = $1 AND ifta_records.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'IFTA record not found or you do not have permission to access it'
            });
        }

        const record = result.rows[0];

        if (!record.file_url) {
            return res.status(404).json({
                error: 'No receipt attached to this IFTA record'
            });
        }

        // Generate signed URL (valid for 1 hour)
        const signedUrl = await getSignedUrl(record.file_url);

        res.json({
            signedUrl,
            filename: record.file_name,
            expiresIn: 3600 // 1 hour in seconds
        });

    } catch (error) {
        console.error('Get IFTA receipt URL error:', error);
        res.status(500).json({
            error: 'Failed to generate signed URL for receipt',
            message: error.message
        });
    }
});

// POST /api/ifta/records - Create new IFTA fuel record
router.post('/records', authenticate, requireSubscription, async (req, res) => {
    try {
        const {
            purchase_date,
            state,
            gallons,
            cost,
            vendor_name,
            receipt_number,
            miles_in_state,
            document_id // Optional - links to scanned receipt in documents table
        } = req.body;

        if (!purchase_date || !state || !gallons || !cost) {
            return res.status(400).json({
                error: 'purchase_date, state, gallons, and cost are required'
            });
        }

        // Determine quarter
        const date = new Date(purchase_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = `${year}-Q${Math.ceil(month / 3)}`;

        const price_per_gallon = cost / gallons;

        const result = await query(
            `INSERT INTO ifta_records (
                user_id, document_id, quarter, year, state, purchase_date, gallons,
                cost, price_per_gallon, vendor_name, receipt_number, miles_in_state
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [req.user.id, document_id || null, quarter, year, state, purchase_date, gallons,
             cost, price_per_gallon, vendor_name, receipt_number, miles_in_state]
        );

        res.status(201).json({
            message: 'IFTA record created successfully',
            record: result.rows[0]
        });

    } catch (error) {
        console.error('Create IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to create IFTA record',
            message: error.message
        });
    }
});

// GET /api/ifta/reports/:quarter - Get IFTA report for a quarter
router.get('/reports/:quarter', authenticate, requireSubscription, async (req, res) => {
    try {
        const { quarter } = req.params; // Format: 2024-Q1

        // Get all records for this quarter
        const records = await query(
            `SELECT state, SUM(gallons) as total_gallons, SUM(cost) as total_cost,
                    SUM(miles_in_state) as total_miles, COUNT(*) as purchase_count
             FROM ifta_records
             WHERE user_id = $1 AND quarter = $2
             GROUP BY state
             ORDER BY state`,
            [req.user.id, quarter]
        );

        // Get overall summary
        const summary = await query(
            `SELECT SUM(gallons) as total_gallons, SUM(cost) as total_cost,
                    SUM(miles_in_state) as total_miles, COUNT(*) as total_purchases
             FROM ifta_records
             WHERE user_id = $1 AND quarter = $2`,
            [req.user.id, quarter]
        );

        res.json({
            quarter,
            summary: summary.rows[0],
            by_state: records.rows
        });

    } catch (error) {
        console.error('Get IFTA report error:', error);
        res.status(500).json({
            error: 'Failed to get IFTA report',
            message: error.message
        });
    }
});

// GET /api/ifta/quarters - Get available quarters
router.get('/quarters', authenticate, requireSubscription, async (req, res) => {
    try {
        const result = await query(
            `SELECT DISTINCT quarter, year
             FROM ifta_records
             WHERE user_id = $1
             ORDER BY year DESC, quarter DESC`,
            [req.user.id]
        );

        res.json({
            quarters: result.rows
        });

    } catch (error) {
        console.error('Get quarters error:', error);
        res.status(500).json({
            error: 'Failed to get quarters',
            message: error.message
        });
    }
});

// PUT /api/ifta/records/:id - Update an IFTA fuel record
router.put('/records/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            purchase_date,
            state,
            gallons,
            cost,
            vendor_name,
            receipt_number,
            miles_in_state
        } = req.body;

        // Check if record exists and belongs to user
        const existingRecord = await query(
            'SELECT id FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                error: 'IFTA record not found or you do not have permission to update it'
            });
        }

        // Determine quarter if date is being updated
        let quarter, year;
        if (purchase_date) {
            const date = new Date(purchase_date);
            year = date.getFullYear();
            const month = date.getMonth() + 1;
            quarter = `${year}-Q${Math.ceil(month / 3)}`;
        }

        // Calculate price per gallon
        let price_per_gallon;
        if (gallons && cost) {
            price_per_gallon = cost / gallons;
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (purchase_date) {
            updates.push(`purchase_date = $${paramCount}`);
            values.push(purchase_date);
            paramCount++;
            updates.push(`quarter = $${paramCount}`);
            values.push(quarter);
            paramCount++;
            updates.push(`year = $${paramCount}`);
            values.push(year);
            paramCount++;
        }
        if (state) {
            updates.push(`state = $${paramCount}`);
            values.push(state);
            paramCount++;
        }
        if (gallons !== undefined) {
            updates.push(`gallons = $${paramCount}`);
            values.push(gallons);
            paramCount++;
        }
        if (cost !== undefined) {
            updates.push(`cost = $${paramCount}`);
            values.push(cost);
            paramCount++;
        }
        if (price_per_gallon) {
            updates.push(`price_per_gallon = $${paramCount}`);
            values.push(price_per_gallon);
            paramCount++;
        }
        if (vendor_name !== undefined) {
            updates.push(`vendor_name = $${paramCount}`);
            values.push(vendor_name);
            paramCount++;
        }
        if (receipt_number !== undefined) {
            updates.push(`receipt_number = $${paramCount}`);
            values.push(receipt_number);
            paramCount++;
        }
        if (miles_in_state !== undefined) {
            updates.push(`miles_in_state = $${paramCount}`);
            values.push(miles_in_state);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No fields to update'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Add id and user_id to values
        values.push(id);
        values.push(req.user.id);

        const result = await query(
            `UPDATE ifta_records
             SET ${updates.join(', ')}
             WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
             RETURNING *`,
            values
        );

        res.json({
            message: 'IFTA record updated successfully',
            record: result.rows[0]
        });

    } catch (error) {
        console.error('Update IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to update IFTA record',
            message: error.message
        });
    }
});

// DELETE /api/ifta/records/:id - Delete an IFTA fuel record
router.delete('/records/:id', authenticate, requireSubscription, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if record exists and belongs to user
        const existingRecord = await query(
            'SELECT id FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (existingRecord.rows.length === 0) {
            return res.status(404).json({
                error: 'IFTA record not found or you do not have permission to delete it'
            });
        }

        // Delete the record
        await query(
            'DELETE FROM ifta_records WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        res.json({
            message: 'IFTA record deleted successfully',
            deleted_id: id
        });

    } catch (error) {
        console.error('Delete IFTA record error:', error);
        res.status(500).json({
            error: 'Failed to delete IFTA record',
            message: error.message
        });
    }
});

module.exports = router;
