/**
 * AI ASSISTANT ROUTE
 *
 * Uses OpenAI GPT-4 to help truck drivers generate:
 * - Daily inspection reports
 * - Log summaries
 * - Compliance documents
 * - Any custom trucking-related text
 *
 * Features:
 * - Voice-to-text support (frontend handles)
 * - Context-aware responses for trucking industry
 * - PDF export ready output
 */

const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

/**
 * POST /api/ai/generate
 * Generate document text using AI
 *
 * Body:
 * - prompt: User's command (e.g., "Create my daily inspection report")
 * - context: Optional context (driver info, truck details)
 * - documentType: Type of document being generated
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt, context = {}, documentType = 'general' } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Prompt is required'
            });
        }

        // Build system message with trucking context
        const systemMessage = `You are an AI assistant specialized in helping truck drivers with their paperwork and documentation.
You understand DOT regulations, IFTA requirements, and common trucking industry terminology.
Generate professional, accurate, and compliant documents.

Driver Context:
- Name: ${context.driverName || 'N/A'}
- Truck: ${context.truckNumber || 'N/A'}
- Company: ${context.companyName || 'N/A'}

Current Date: ${new Date().toLocaleDateString()}`;

        // Generate response using GPT-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: systemMessage
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const generatedText = completion.choices[0].message.content;

        res.json({
            success: true,
            text: generatedText,
            usage: {
                tokens: completion.usage.total_tokens,
                cost: (completion.usage.total_tokens * 0.00003).toFixed(4) // Approx GPT-4 cost
            }
        });

    } catch (error) {
        console.error('AI generation error:', error);

        if (error.code === 'insufficient_quota') {
            return res.status(402).json({
                error: 'OpenAI API quota exceeded. Please add credits.',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Failed to generate document',
            message: error.message
        });
    }
});

/**
 * GET /api/ai/templates
 * Get predefined templates for common documents
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = [
            {
                id: 'daily-inspection',
                name: 'Daily Vehicle Inspection Report',
                description: 'DOT-compliant daily inspection checklist',
                prompt: 'Create a detailed daily vehicle inspection report for a commercial truck, including all required DOT sections.'
            },
            {
                id: 'log-summary',
                name: 'Daily Log Summary',
                description: 'Summary of driving hours and activities',
                prompt: 'Create a daily log summary showing driving hours, rest periods, and total miles driven today.'
            },
            {
                id: 'incident-report',
                name: 'Incident Report',
                description: 'Document any incidents or accidents',
                prompt: 'Create an incident report template for documenting any road incidents or vehicle issues.'
            },
            {
                id: 'maintenance-log',
                name: 'Maintenance Log Entry',
                description: 'Record vehicle maintenance activities',
                prompt: 'Create a maintenance log entry documenting recent vehicle service or repairs.'
            }
        ];

        res.json({
            templates
        });

    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            error: 'Failed to get templates'
        });
    }
});

module.exports = router;
