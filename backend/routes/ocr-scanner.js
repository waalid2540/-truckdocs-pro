/**
 * OCR RECEIPT SCANNER ROUTE
 *
 * Uses Tesseract.js to extract text from receipt images
 * Auto-fills expense form with extracted data:
 * - Amount/Total
 * - Date
 * - Vendor/Store name
 * - Category (fuel, food, maintenance, etc.)
 *
 * Features:
 * - Supports image upload (JPG, PNG)
 * - Camera capture from mobile devices
 * - Intelligent parsing of receipt data
 * - Returns structured data for auto-fill
 */

const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

// Configure multer for memory storage (we process in-memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * POST /api/ocr/scan-receipt
 * Upload receipt image and extract data
 *
 * Multipart form data:
 * - receiptImage: The image file
 *
 * Returns:
 * - extractedText: Raw OCR text
 * - parsedData: Structured expense data (amount, date, vendor, category)
 */
router.post('/scan-receipt', upload.single('receiptImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided'
            });
        }

        console.log('Processing receipt image...');

        // Perform OCR on the uploaded image
        const result = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            {
                logger: info => console.log(info) // Progress logging
            }
        );

        const extractedText = result.data.text;
        console.log('OCR Text extracted:', extractedText);

        // Parse the extracted text for expense data
        const parsedData = parseReceiptText(extractedText);

        res.json({
            success: true,
            extractedText,
            parsedData,
            confidence: result.data.confidence
        });

    } catch (error) {
        console.error('OCR scan error:', error);
        res.status(500).json({
            error: 'Failed to scan receipt',
            message: error.message
        });
    }
});

/**
 * HELPER FUNCTION: Parse receipt text into structured data
 * Uses regex patterns to extract amount, date, vendor, etc.
 */
function parseReceiptText(text) {
    const parsedData = {
        amount: null,
        date: null,
        vendor: null,
        category: null,
        description: ''
    };

    // Convert to uppercase for easier pattern matching
    const upperText = text.toUpperCase();
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // 1. Extract AMOUNT (look for total, balance, amount due)
    const amountPatterns = [
        /TOTAL[\s:$]*(\d+\.\d{2})/i,
        /AMOUNT[\s:$]*(\d+\.\d{2})/i,
        /BALANCE[\s:$]*(\d+\.\d{2})/i,
        /\$\s*(\d+\.\d{2})/,
        /(\d+\.\d{2})\s*USD/i
    ];

    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.amount = parseFloat(match[1]);
            break;
        }
    }

    // 2. Extract DATE (various date formats)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{1,2},?\s+\d{4}/i,
        /\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}/i
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.date = match[0];
            break;
        }
    }

    // 3. Extract VENDOR (usually first line or near top)
    if (lines.length > 0) {
        // Take first non-empty line as vendor name
        parsedData.vendor = lines[0].trim();
    }

    // 4. Determine CATEGORY based on keywords
    const categories = {
        fuel: ['FUEL', 'GAS', 'DIESEL', 'PETROL', 'SHELL', 'EXXON', 'CHEVRON', 'BP', 'MOBIL', 'PILOT', "LOVE'S"],
        food: ['RESTAURANT', 'CAFE', 'DINER', 'FOOD', 'MCDONALD', 'BURGER', 'SUBWAY', 'PIZZA'],
        maintenance: ['REPAIR', 'SERVICE', 'PARTS', 'TIRE', 'OIL CHANGE', 'MECHANIC', 'AUTO'],
        tolls: ['TOLL', 'TURNPIKE', 'EZPASS', 'TOLLWAY'],
        parking: ['PARKING', 'PARK', 'LOT'],
        lodging: ['HOTEL', 'MOTEL', 'INN', 'LODGE', 'COMFORT', 'HOLIDAY INN'],
        other: []
    };

    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (upperText.includes(keyword)) {
                parsedData.category = category;
                break;
            }
        }
        if (parsedData.category) break;
    }

    // Default category if none detected
    if (!parsedData.category) {
        parsedData.category = 'other';
    }

    // 5. Generate description from vendor and category
    parsedData.description = `${parsedData.vendor || 'Receipt'} - ${parsedData.category}`;

    return parsedData;
}

/**
 * POST /api/ocr/scan-ifta
 * Upload fuel receipt and extract IFTA-specific data
 *
 * Multipart form data:
 * - receiptImage: The fuel receipt image file
 *
 * Returns:
 * - extractedText: Raw OCR text
 * - parsedData: Structured IFTA data (gallons, cost, state, date, vendor)
 */
router.post('/scan-ifta', upload.single('receiptImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided'
            });
        }

        console.log('Processing IFTA fuel receipt...');

        // Perform OCR on the uploaded image
        const result = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            {
                logger: info => console.log(info) // Progress logging
            }
        );

        const extractedText = result.data.text;
        console.log('OCR Text extracted:', extractedText);

        // Parse the extracted text for IFTA fuel data
        const parsedData = parseIFTAReceipt(extractedText);

        res.json({
            success: true,
            extractedText,
            parsedData,
            confidence: result.data.confidence
        });

    } catch (error) {
        console.error('IFTA OCR scan error:', error);
        res.status(500).json({
            error: 'Failed to scan IFTA receipt',
            message: error.message
        });
    }
});

/**
 * HELPER FUNCTION: Parse IFTA fuel receipt into structured data
 * Extracts gallons, cost, state, date, vendor, etc.
 */
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

    // 1. Extract GALLONS (common patterns on fuel receipts)
    const gallonPatterns = [
        /(?:GALLONS?|GAL|VOLUME)[\s:]*(\d+\.\d{1,3})/i,
        /(\d+\.\d{1,3})\s*(?:GAL|GALLONS?)/i,
        /FUEL\s+(?:SALE|QTY|QUANTITY)[\s:]*(\d+\.\d{1,3})/i,
        /PRODUCT\s+\d+.*?(\d+\.\d{1,3})\s*G/i
    ];

    for (const pattern of gallonPatterns) {
        const match = text.match(pattern);
        if (match) {
            const gallons = parseFloat(match[1]);
            if (gallons > 0 && gallons < 500) { // Sanity check (0-500 gallons)
                parsedData.gallons = gallons;
                break;
            }
        }
    }

    // 2. Extract TOTAL COST (look for total, fuel total, amount)
    const costPatterns = [
        /(?:TOTAL|FUEL\s+TOTAL|AMOUNT)[\s:$]*(\d+\.\d{2})/i,
        /\$\s*(\d+\.\d{2})/,
        /(\d{2,3}\.\d{2})\s*(?:USD|TOTAL)/i
    ];

    for (const pattern of costPatterns) {
        const match = text.match(pattern);
        if (match) {
            const cost = parseFloat(match[1]);
            if (cost > 0 && cost < 2000) { // Sanity check (0-$2000)
                parsedData.cost = cost;
                break;
            }
        }
    }

    // 3. Calculate PRICE PER GALLON (if we have both gallons and cost)
    if (parsedData.gallons && parsedData.cost) {
        parsedData.price_per_gallon = parseFloat((parsedData.cost / parsedData.gallons).toFixed(3));
    } else {
        // Try to extract price per gallon directly
        const pricePatterns = [
            /(?:PRICE|PPG|RATE)[\s:$]*(\d+\.\d{2,3})/i,
            /\$(\d+\.\d{2,3})\/GAL/i
        ];
        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                parsedData.price_per_gallon = parseFloat(match[1]);
                break;
            }
        }
    }

    // 4. Extract DATE
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{1,2},?\s+\d{4}/i
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            parsedData.purchase_date = match[0];
            break;
        }
    }

    // 5. Extract STATE (look for US state codes)
    const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;
    const stateMatch = upperText.match(statePattern);
    if (stateMatch) {
        parsedData.state = stateMatch[1];
    }

    // 6. Extract VENDOR NAME (usually first line or look for known truck stops)
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

    // If no known vendor, use first line
    if (!parsedData.vendor_name && lines.length > 0) {
        parsedData.vendor_name = lines[0].trim();
    }

    // 7. Extract RECEIPT NUMBER
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

/**
 * POST /api/ocr/test
 * Test endpoint to verify OCR is working
 */
router.post('/test', (req, res) => {
    res.json({
        message: 'OCR Scanner API is ready',
        tesseractVersion: Tesseract.version
    });
});

module.exports = router;
