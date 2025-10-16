const Tesseract = require('tesseract.js');

/**
 * Extract text from image using Tesseract OCR
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {String} - Extracted text
 */
const extractTextFromImage = async (imageBuffer) => {
    try {
        const { data: { text } } = await Tesseract.recognize(
            imageBuffer,
            'eng', // English language
            {
                logger: m => console.log('OCR Progress:', m) // Optional: log progress
            }
        );

        return text.trim();

    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract text from image');
    }
};

/**
 * Extract amount from receipt text
 * Uses regex to find dollar amounts
 * @param {String} text - OCR extracted text
 * @returns {Number|null} - Extracted amount or null
 */
const extractAmountFromText = (text) => {
    try {
        // Look for patterns like $XX.XX or XX.XX
        const patterns = [
            /\$\s?(\d+\.\d{2})/g,  // $12.34
            /total[:\s]+\$?\s?(\d+\.\d{2})/gi, // Total: $12.34
            /amount[:\s]+\$?\s?(\d+\.\d{2})/gi, // Amount: $12.34
        ];

        const amounts = [];

        patterns.forEach(pattern => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const amount = parseFloat(match[1]);
                if (!isNaN(amount)) {
                    amounts.push(amount);
                }
            }
        });

        // Return the highest amount found (usually the total)
        return amounts.length > 0 ? Math.max(...amounts) : null;

    } catch (error) {
        console.error('Amount extraction error:', error);
        return null;
    }
};

/**
 * Extract date from receipt text
 * @param {String} text - OCR extracted text
 * @returns {String|null} - Extracted date in YYYY-MM-DD format or null
 */
const extractDateFromText = (text) => {
    try {
        // Look for date patterns
        const patterns = [
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, // MM/DD/YYYY or M/D/YY
            /(\d{1,2}-\d{1,2}-\d{2,4})/g,   // MM-DD-YYYY
            /(\d{4}-\d{2}-\d{2})/g,         // YYYY-MM-DD
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                // Parse and format date
                const dateStr = match[0];
                const date = new Date(dateStr);

                if (!isNaN(date.getTime())) {
                    // Format as YYYY-MM-DD
                    return date.toISOString().split('T')[0];
                }
            }
        }

        return null;

    } catch (error) {
        console.error('Date extraction error:', error);
        return null;
    }
};

/**
 * Extract vendor/merchant name from receipt
 * @param {String} text - OCR extracted text
 * @returns {String|null} - Vendor name or null
 */
const extractVendorFromText = (text) => {
    try {
        // Take first line as vendor name (usually store name is at top)
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        if (lines.length > 0) {
            // Return first meaningful line (more than 2 chars)
            const vendor = lines.find(line => line.trim().length > 2);
            return vendor ? vendor.trim() : null;
        }

        return null;

    } catch (error) {
        console.error('Vendor extraction error:', error);
        return null;
    }
};

/**
 * Smart receipt analyzer - extracts all info at once
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Object} - Extracted data { text, amount, date, vendor }
 */
const analyzeReceipt = async (imageBuffer) => {
    try {
        // Extract text
        const text = await extractTextFromImage(imageBuffer);

        // Extract structured data
        const amount = extractAmountFromText(text);
        const date = extractDateFromText(text);
        const vendor = extractVendorFromText(text);

        return {
            text,
            amount,
            date,
            vendor
        };

    } catch (error) {
        console.error('Receipt analysis error:', error);
        throw new Error('Failed to analyze receipt');
    }
};

module.exports = {
    extractTextFromImage,
    extractAmountFromText,
    extractDateFromText,
    extractVendorFromText,
    analyzeReceipt
};
