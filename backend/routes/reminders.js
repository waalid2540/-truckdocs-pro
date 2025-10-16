/**
 * REMINDER NOTIFICATIONS ROUTE
 *
 * Manages deadline reminders and notifications for truck drivers
 * Features:
 * - IFTA quarterly deadline reminders
 * - Document expiration alerts
 * - Inspection due dates
 * - Custom reminder creation
 *
 * In production, this would use:
 * - Cron jobs to check deadlines daily
 * - Email notifications (Nodemailer)
 * - In-app notification system
 * - Push notifications (optional)
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/reminders/upcoming
 * Get upcoming reminders for the user
 *
 * Returns:
 * - Array of reminders with type, title, description, due_date, priority
 */
router.get('/upcoming', async (req, res) => {
    try {
        // For demo mode - return sample reminders
        const now = new Date();
        const reminders = [
            {
                id: 1,
                type: 'ifta',
                title: 'IFTA Quarterly Report Due',
                description: 'Q1 2025 IFTA report must be filed',
                due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                priority: 'high',
                status: 'pending'
            },
            {
                id: 2,
                type: 'inspection',
                title: 'Annual Vehicle Inspection',
                description: 'Commercial vehicle safety inspection required',
                due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                priority: 'medium',
                status: 'pending'
            },
            {
                id: 3,
                type: 'document',
                title: 'Medical Certificate Expiring',
                description: 'DOT medical certificate expires soon',
                due_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                priority: 'medium',
                status: 'pending'
            },
            {
                id: 4,
                type: 'maintenance',
                title: 'Oil Change Due',
                description: 'Vehicle maintenance: Oil change at 150,000 miles',
                due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                priority: 'low',
                status: 'pending'
            }
        ];

        // Sort by due date (soonest first)
        reminders.sort((a, b) => a.due_date - b.due_date);

        res.json({
            reminders,
            count: reminders.length
        });

    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({
            error: 'Failed to get reminders',
            message: error.message
        });
    }
});

/**
 * POST /api/reminders/create
 * Create a custom reminder
 *
 * Body:
 * - type: Type of reminder (custom, ifta, inspection, document, maintenance)
 * - title: Reminder title
 * - description: Reminder description
 * - due_date: Due date (ISO string)
 * - priority: Priority level (low, medium, high)
 */
router.post('/create', async (req, res) => {
    try {
        const { type, title, description, due_date, priority } = req.body;

        if (!title || !due_date) {
            return res.status(400).json({
                error: 'Title and due date are required'
            });
        }

        // For demo mode - return success
        const newReminder = {
            id: Date.now(),
            type: type || 'custom',
            title,
            description: description || '',
            due_date: new Date(due_date),
            priority: priority || 'medium',
            status: 'pending',
            created_at: new Date()
        };

        res.json({
            success: true,
            reminder: newReminder,
            message: 'Reminder created successfully'
        });

    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({
            error: 'Failed to create reminder',
            message: error.message
        });
    }
});

/**
 * PUT /api/reminders/:id/complete
 * Mark a reminder as completed
 */
router.put('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;

        // For demo mode - return success
        res.json({
            success: true,
            message: `Reminder ${id} marked as completed`
        });

    } catch (error) {
        console.error('Complete reminder error:', error);
        res.status(500).json({
            error: 'Failed to complete reminder',
            message: error.message
        });
    }
});

/**
 * DELETE /api/reminders/:id
 * Delete a reminder
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // For demo mode - return success
        res.json({
            success: true,
            message: `Reminder ${id} deleted successfully`
        });

    } catch (error) {
        console.error('Delete reminder error:', error);
        res.status(500).json({
            error: 'Failed to delete reminder',
            message: error.message
        });
    }
});

/**
 * GET /api/reminders/ifta-deadlines
 * Get IFTA quarterly deadlines for the year
 */
router.get('/ifta-deadlines', (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const deadlines = [
            {
                quarter: 'Q1',
                period: `Jan 1 - Mar 31, ${currentYear}`,
                deadline: new Date(currentYear, 3, 30), // April 30
                status: 'upcoming'
            },
            {
                quarter: 'Q2',
                period: `Apr 1 - Jun 30, ${currentYear}`,
                deadline: new Date(currentYear, 6, 31), // July 31
                status: 'upcoming'
            },
            {
                quarter: 'Q3',
                period: `Jul 1 - Sep 30, ${currentYear}`,
                deadline: new Date(currentYear, 9, 31), // October 31
                status: 'upcoming'
            },
            {
                quarter: 'Q4',
                period: `Oct 1 - Dec 31, ${currentYear}`,
                deadline: new Date(currentYear + 1, 0, 31), // January 31 next year
                status: 'upcoming'
            }
        ];

        res.json({
            year: currentYear,
            deadlines
        });

    } catch (error) {
        console.error('Get IFTA deadlines error:', error);
        res.status(500).json({
            error: 'Failed to get IFTA deadlines',
            message: error.message
        });
    }
});

/**
 * POST /api/reminders/send-test-email
 * Send a test notification email (for testing purposes)
 *
 * In production, this would use Nodemailer to send actual emails
 */
router.post('/send-test-email', async (req, res) => {
    try {
        const { email, subject, message } = req.body;

        // For demo mode - simulate email sending
        console.log('📧 Test email would be sent:');
        console.log(`   To: ${email}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Message: ${message}`);

        res.json({
            success: true,
            message: 'Test email sent (demo mode - check console)',
            demo: true
        });

    } catch (error) {
        console.error('Send test email error:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            message: error.message
        });
    }
});

module.exports = router;
