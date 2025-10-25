const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const router = express.Router();

// GET /reset-user - Reset a user's password and unlock account
router.get('/reset-user', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                error: 'Email parameter required',
                usage: '/reset-user?email=your@email.com'
            });
        }

        // Check if user exists
        const userCheck = await query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                email: email
            });
        }

        const userId = userCheck.rows[0].id;

        // Reset password to "password123" (user can change later)
        const newPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Reset password, unlock account, reset failed attempts
        await query(
            `UPDATE users SET
                password_hash = $1,
                failed_login_attempts = 0,
                account_locked_until = NULL,
                last_failed_login = NULL
             WHERE id = $2`,
            [password_hash, userId]
        );

        res.json({
            success: true,
            message: 'User account reset successfully!',
            email: email,
            new_password: newPassword,
            instructions: 'You can now login with this password. Please change it in Settings after logging in.'
        });

    } catch (error) {
        console.error('Reset user error:', error);
        res.status(500).json({
            error: 'Failed to reset user',
            message: error.message
        });
    }
});

module.exports = router;
