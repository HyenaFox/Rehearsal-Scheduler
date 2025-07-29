const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

// Send poll creation notifications
router.post('/poll-created/:pollId', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can send notifications' });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get target actors with email addresses
    const targetActorIds = poll.targetActors.map(target => target.actorId);
    const targetActors = await User.find({ 
      _id: { $in: targetActorIds },
      email: { $exists: true, $ne: '' }
    }).select('name email');

    if (targetActors.length === 0) {
      return res.status(400).json({ error: 'No actors with valid email addresses found' });
    }

    const result = await emailService.sendPollCreatedNotification(poll, targetActors);
    
    if (result.success) {
      res.json({ 
        message: 'Poll creation notifications sent successfully',
        recipientCount: targetActors.length,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send notifications',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending poll creation notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error.message 
    });
  }
});

// Send poll reminder notifications
router.post('/poll-reminder/:pollId', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can send notifications' });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get target actors who haven't responded yet
    const targetActorIds = poll.targetActors.map(target => target.actorId);
    const respondedActorIds = [...new Set(poll.responses.map(response => response.actorId.toString()))];
    
    const unrespondedActorIds = targetActorIds.filter(id => 
      !respondedActorIds.includes(id.toString())
    );

    if (unrespondedActorIds.length === 0) {
      return res.json({ 
        message: 'All actors have already responded to this poll',
        recipientCount: 0
      });
    }

    const targetActors = await User.find({ 
      _id: { $in: unrespondedActorIds },
      email: { $exists: true, $ne: '' }
    }).select('name email');

    const result = await emailService.sendPollReminderNotification(poll, targetActors);
    
    if (result.success) {
      res.json({ 
        message: 'Poll reminder notifications sent successfully',
        recipientCount: targetActors.length,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send reminders',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending poll reminder notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send reminders',
      details: error.message 
    });
  }
});

// Send rehearsal scheduled notifications
router.post('/rehearsal-scheduled/:rehearsalId', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can send notifications' });
    }

    const rehearsal = await Rehearsal.findById(req.params.rehearsalId);
    if (!rehearsal) {
      return res.status(404).json({ error: 'Rehearsal not found' });
    }

    // Get actors with email addresses
    const actorIds = rehearsal.actorIds || [];
    const actors = await User.find({ 
      _id: { $in: actorIds },
      email: { $exists: true, $ne: '' }
    }).select('name email');

    if (actors.length === 0) {
      return res.status(400).json({ error: 'No actors with valid email addresses found' });
    }

    const result = await emailService.sendRehearsalScheduledNotification(rehearsal, actors);
    
    if (result.success) {
      res.json({ 
        message: 'Rehearsal scheduled notifications sent successfully',
        recipientCount: actors.length,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send notifications',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending rehearsal scheduled notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error.message 
    });
  }
});

// Send rehearsal reminder notifications (for upcoming rehearsals)
router.post('/rehearsal-reminders', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can send notifications' });
    }

    // Find rehearsals happening tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    const upcomingRehearsals = await Rehearsal.find({
      date: tomorrowDateString
    });

    if (upcomingRehearsals.length === 0) {
      return res.json({ 
        message: 'No rehearsals scheduled for tomorrow',
        rehearsalCount: 0,
        totalRecipients: 0
      });
    }

    let totalRecipients = 0;
    const results = [];

    for (const rehearsal of upcomingRehearsals) {
      const actorIds = rehearsal.actorIds || [];
      const actors = await User.find({ 
        _id: { $in: actorIds },
        email: { $exists: true, $ne: '' }
      }).select('name email');

      if (actors.length > 0) {
        const result = await emailService.sendRehearsalReminderNotification(rehearsal, actors);
        results.push({
          rehearsalId: rehearsal._id,
          rehearsalTitle: rehearsal.title,
          success: result.success,
          recipientCount: actors.length,
          error: result.error
        });
        
        if (result.success) {
          totalRecipients += actors.length;
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({ 
      message: `Rehearsal reminders processed for ${upcomingRehearsals.length} rehearsals`,
      rehearsalCount: upcomingRehearsals.length,
      successfulNotifications: successCount,
      totalRecipients,
      results
    });
  } catch (error) {
    console.error('Error sending rehearsal reminder notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send reminders',
      details: error.message 
    });
  }
});

// Test email configuration
router.get('/test-email', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can test email configuration' });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'Your account does not have an email address' });
    }

    const testHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6;">📧 Email Test Successful!</h1>
        <p>This is a test email from your Rehearsal Scheduler application.</p>
        <p><strong>Sent to:</strong> ${user.name} (${user.email})</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          If you received this email, your email configuration is working correctly.
        </p>
      </div>
    `;

    const result = await emailService.sendEmail({
      to: user.email,
      subject: '📧 Rehearsal Scheduler Email Test',
      html: testHTML
    });

    if (result.success) {
      res.json({ 
        message: 'Test email sent successfully',
        recipient: user.email,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send test email',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

// Get notification settings/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can view notification status' });
    }

    // Check email service status
    const emailConfigured = !!emailService.transporter;
    
    // Get recent polls and rehearsals for notification opportunities
    const recentPolls = await Poll.find({ 
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).countDocuments();

    const upcomingRehearsals = await Rehearsal.find({
      date: { $gte: new Date().toISOString().split('T')[0] }
    }).countDocuments();

    // Count users with email addresses
    const usersWithEmail = await User.countDocuments({
      email: { $exists: true, $ne: '' }
    });

    const totalUsers = await User.countDocuments();

    res.json({
      emailService: {
        configured: emailConfigured,
        status: emailConfigured ? 'ready' : 'not configured'
      },
      statistics: {
        recentPolls,
        upcomingRehearsals,
        usersWithEmail,
        totalUsers,
        emailCoverage: totalUsers > 0 ? Math.round((usersWithEmail / totalUsers) * 100) : 0
      },
      environment: process.env.NODE_ENV || 'development',
      fromEmail: process.env.FROM_EMAIL || 'noreply@rehearsal-scheduler.com'
    });
  } catch (error) {
    console.error('Error getting notification status:', error);
    res.status(500).json({ 
      error: 'Failed to get notification status',
      details: error.message 
    });
  }
});

module.exports = router;