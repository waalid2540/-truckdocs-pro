const PDFDocument = require('pdfkit');
const { uploadToS3 } = require('./fileUpload');

/**
 * Generate official IFTA quarterly tax return PDF
 * @param {Object} reportData - IFTA report data with summary and by_state breakdown
 * @param {Object} userData - User information (name, company, MC number, etc.)
 * @param {String} userId - User ID for S3 upload path
 * @returns {Promise<String>} - S3 URL of generated PDF
 */
async function generateIFTAPDF(reportData, userData, userId) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', async () => {
                try {
                    const pdfBuffer = Buffer.concat(chunks);

                    // Create a fake file object for S3 upload
                    const file = {
                        buffer: pdfBuffer,
                        originalname: `IFTA_${reportData.quarter}_${Date.now()}.pdf`,
                        mimetype: 'application/pdf',
                        size: pdfBuffer.length
                    };

                    // Upload to S3
                    const s3Url = await uploadToS3(file, userId);
                    resolve(s3Url);
                } catch (error) {
                    reject(error);
                }
            });

            // Parse quarter (e.g., "2024-Q1" -> "Q1 2024")
            const [year, quarterNum] = reportData.quarter.split('-');
            const quarterDisplay = `${quarterNum} ${year}`;

            // HEADER
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('INTERNATIONAL FUEL TAX AGREEMENT', { align: 'center' })
                .moveDown(0.3);

            doc
                .fontSize(16)
                .text('QUARTERLY FUEL TAX RETURN', { align: 'center' })
                .moveDown(0.2);

            doc
                .fontSize(12)
                .font('Helvetica')
                .text(`Quarter: ${quarterDisplay}`, { align: 'center' })
                .moveDown(1);

            // LICENSEE INFORMATION BOX
            const boxY = doc.y;
            doc
                .rect(50, boxY, 512, 120)
                .stroke();

            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('LICENSEE INFORMATION', 60, boxY + 10)
                .moveDown(0.5);

            doc
                .font('Helvetica')
                .fontSize(9);

            const infoStartY = doc.y;
            // Left column
            doc
                .text(`Company: ${userData.company_name || 'N/A'}`, 60, infoStartY)
                .text(`Name: ${userData.full_name}`, 60)
                .text(`Phone: ${userData.phone || 'N/A'}`, 60);

            // Right column
            doc
                .text(`MC Number: ${userData.mc_number || 'N/A'}`, 320, infoStartY)
                .text(`DOT Number: ${userData.dot_number || 'N/A'}`, 320)
                .text(`Report Date: ${new Date().toLocaleDateString()}`, 320);

            doc.y = boxY + 130;
            doc.moveDown(1);

            // SUMMARY SECTION
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('QUARTERLY SUMMARY', { underline: true })
                .moveDown(0.5);

            const summary = reportData.summary;
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Total Miles Traveled: ${formatNumber(summary.total_miles)} miles`)
                .text(`Total Fuel Purchased: ${formatNumber(summary.total_gallons)} gallons`)
                .text(`Average Fuel Economy: ${summary.average_mpg} MPG`)
                .text(`Total Fuel Cost: $${formatNumber(summary.total_cost)}`)
                .moveDown(0.5);

            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(`Total Tax Paid: $${formatNumber(summary.total_tax_paid)}`)
                .text(`Total Tax Owed: $${formatNumber(summary.total_tax_owed)}`)
                .fontSize(12)
                .fillColor(summary.net_tax_due >= 0 ? 'red' : 'green')
                .text(
                    `NET TAX ${summary.net_tax_due >= 0 ? 'DUE' : 'CREDIT'}: $${formatNumber(Math.abs(summary.net_tax_due))}`,
                    { underline: true }
                )
                .fillColor('black')
                .moveDown(1);

            // STATE-BY-STATE BREAKDOWN TABLE
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('JURISDICTION BREAKDOWN', { underline: true })
                .moveDown(0.5);

            // Table headers
            const tableTop = doc.y;
            const col1X = 50;   // State
            const col2X = 90;   // Miles
            const col3X = 150;  // Gallons
            const col4X = 210;  // Tax Rate
            const col5X = 270;  // Tax Paid
            const col6X = 330;  // Tax Owed
            const col7X = 400;  // Net Tax
            const col8X = 470;  // Status

            doc
                .fontSize(8)
                .font('Helvetica-Bold');

            doc.text('State', col1X, tableTop);
            doc.text('Miles', col2X, tableTop);
            doc.text('Gallons', col3X, tableTop);
            doc.text('Tax Rate', col4X, tableTop);
            doc.text('Tax Paid', col5X, tableTop);
            doc.text('Tax Owed', col6X, tableTop);
            doc.text('Net Tax', col7X, tableTop);
            doc.text('Status', col8X, tableTop);

            // Draw line under headers
            doc
                .moveTo(50, tableTop + 12)
                .lineTo(545, tableTop + 12)
                .stroke();

            let currentY = tableTop + 18;

            // Sort states: those owing money first, then credits
            const sortedStates = [...reportData.by_state].sort((a, b) => b.net_tax - a.net_tax);

            doc.font('Helvetica').fontSize(7);

            for (const state of sortedStates) {
                // Check if we need a new page
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }

                const status = state.net_tax > 0 ? 'DUE' : state.net_tax < 0 ? 'CREDIT' : 'EVEN';
                const statusColor = state.net_tax > 0 ? '#d32f2f' : state.net_tax < 0 ? '#388e3c' : '#666';

                doc.text(state.state, col1X, currentY);
                doc.text(formatNumber(state.miles_driven), col2X, currentY);
                doc.text(formatNumber(state.gallons_purchased), col3X, currentY);
                doc.text(`$${state.tax_rate.toFixed(4)}`, col4X, currentY);
                doc.text(`$${formatNumber(state.tax_paid)}`, col5X, currentY);
                doc.text(`$${formatNumber(state.tax_owed)}`, col6X, currentY);
                doc.text(`$${formatNumber(Math.abs(state.net_tax))}`, col7X, currentY);
                doc.fillColor(statusColor).text(status, col8X, currentY).fillColor('black');

                currentY += 14;
            }

            // Draw final line
            doc
                .moveTo(50, currentY)
                .lineTo(545, currentY)
                .stroke();

            currentY += 10;

            // TOTALS ROW
            doc
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('TOTALS:', col1X, currentY);
            doc.text(formatNumber(summary.total_miles), col2X, currentY);
            doc.text(formatNumber(summary.total_gallons), col3X, currentY);
            doc.text(`$${formatNumber(summary.total_tax_paid)}`, col5X, currentY);
            doc.text(`$${formatNumber(summary.total_tax_owed)}`, col6X, currentY);

            const netDueColor = summary.net_tax_due >= 0 ? '#d32f2f' : '#388e3c';
            doc
                .fillColor(netDueColor)
                .text(`$${formatNumber(Math.abs(summary.net_tax_due))}`, col7X, currentY)
                .fillColor('black');

            // Add new page for warnings and instructions
            doc.addPage();
            doc.fontSize(12).font('Helvetica-Bold').text('WARNINGS & RECOMMENDATIONS', { underline: true }).moveDown(0.5);

            if (reportData.warnings && reportData.warnings.length > 0) {
                for (const warning of reportData.warnings) {
                    const icon = warning.severity === 'high' ? '⚠️' :
                                warning.severity === 'medium' ? '⚡' : 'ℹ️';

                    doc
                        .fontSize(10)
                        .font('Helvetica-Bold')
                        .text(`${icon} ${warning.message}`)
                        .font('Helvetica')
                        .fontSize(9)
                        .text(`Action: ${warning.action}`)
                        .moveDown(0.5);
                }
            } else {
                doc.fontSize(10).font('Helvetica').text('No warnings or recommendations at this time.');
            }

            doc.moveDown(1);

            // FOOTER / DISCLAIMER
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('IMPORTANT NOTES', { underline: true })
                .moveDown(0.5);

            doc
                .fontSize(9)
                .font('Helvetica')
                .text('• This report is generated by FreightHub Pro and is for informational purposes only.')
                .text('• Tax calculations are based on IFTA official tax rates and standard formulas.')
                .text('• You are responsible for verifying all data before filing with your base jurisdiction.')
                .text('• Keep all fuel receipts for at least 4 years as required by IFTA.')
                .text('• File your IFTA return by the last day of the month following the quarter end.')
                .text('• Late filings may result in penalties and interest charges.')
                .moveDown(1);

            doc
                .fontSize(8)
                .fillColor('#666')
                .text(`Generated by FreightHub Pro on ${new Date().toLocaleString()}`, { align: 'center' })
                .text('https://freighthubpro.com', { align: 'center', link: 'https://freighthubpro.com' });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to format numbers with commas
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

module.exports = { generateIFTAPDF };
