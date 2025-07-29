const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Configure email transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production email configuration (using a service like SendGrid, Mailgun, etc.)
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
        } else {
          console.warn('⚠️ Production email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
        }
      } else {
        // Development email configuration (using Ethereal for testing)
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          console.log('📧 Development email service initialized with Ethereal Email');
        } catch (error) {
          console.warn('⚠️ Could not initialize development email service:', error.message);
        }
      }

      if (this.transporter) {
        // Verify the connection
        await this.transporter.verify();
        console.log('✅ Email service is ready');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('⚠️ Email service not available, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@rehearsal-scheduler.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // In development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email sent:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Convert HTML to plain text for email fallback
  htmlToText(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  // Poll notification templates
  async sendPollCreatedNotification(poll, targetActors) {
    const recipients = targetActors.map(actor => actor.email || actor.actorEmail).filter(Boolean);
    
    if (recipients.length === 0) {
      return { success: false, error: 'No valid email addresses found' };
    }

    const subject = `📊 New Poll: ${poll.title}`;
    const html = this.generatePollCreatedHTML(poll);

    return await this.sendEmail({
      to: recipients,
      subject,
      html
    });
  }

  async sendPollReminderNotification(poll, targetActors) {
    const recipients = targetActors
      .filter(actor => !poll.responses.some(response => response.actorId === actor._id))
      .map(actor => actor.email)
      .filter(Boolean);

    if (recipients.length === 0) {
      return { success: false, error: 'No actors need reminders' };
    }

    const subject = `⏰ Reminder: Please respond to poll "${poll.title}"`;
    const html = this.generatePollReminderHTML(poll);

    return await this.sendEmail({
      to: recipients,
      subject,
      html
    });
  }

  async sendRehearsalScheduledNotification(rehearsal, actors) {
    const recipients = actors.map(actor => actor.email).filter(Boolean);
    
    if (recipients.length === 0) {
      return { success: false, error: 'No valid email addresses found' };
    }

    const subject = `🎭 Rehearsal Scheduled: ${rehearsal.title}`;
    const html = this.generateRehearsalScheduledHTML(rehearsal);

    return await this.sendEmail({
      to: recipients,
      subject,
      html
    });
  }

  async sendRehearsalReminderNotification(rehearsal, actors) {
    const recipients = actors.map(actor => actor.email).filter(Boolean);
    
    if (recipients.length === 0) {
      return { success: false, error: 'No valid email addresses found' };
    }

    const subject = `🔔 Rehearsal Reminder: ${rehearsal.title} - Tomorrow`;
    const html = this.generateRehearsalReminderHTML(rehearsal);

    return await this.sendEmail({
      to: recipients,
      subject,
      html
    });
  }

  // HTML Templates
  generatePollCreatedHTML(poll) {
    const timeSlotsList = poll.timeSlots.map(slot => 
      `<li>📅 ${slot.date} at ${slot.startTime} - ${slot.endTime}${slot.description ? ` (${slot.description})` : ''}</li>`
    ).join('');

    const scenesList = poll.scenes && poll.scenes.length > 0 
      ? `<p><strong>Related Scenes:</strong> ${poll.scenes.join(', ')}</p>` 
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1e293b; margin-bottom: 16px;">🗳️ New Poll Created</h1>
          
          <h2 style="color: #3b82f6; margin-bottom: 12px;">${poll.title}</h2>
          
          ${poll.description ? `<p style="color: #64748b; margin-bottom: 16px;">${poll.description}</p>` : ''}
          
          <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <h3 style="color: #1e293b; margin-bottom: 12px;">Available Time Slots:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${timeSlotsList}
            </ul>
          </div>
          
          ${scenesList}
          
          <p style="color: #374151; margin-bottom: 20px;">
            Please respond to this poll by selecting your availability for each time slot. 
            Your response helps us find the best time for everyone to meet.
          </p>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://rehearsal-scheduler.onrender.com'}/polls" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📝 Respond to Poll
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            You received this email because you're part of the ${poll.createdByName}'s rehearsal schedule.
            <br>
            Rehearsal Scheduler - Making theater coordination easier
          </p>
        </div>
      </div>
    `;
  }

  generatePollReminderHTML(poll) {
    const deadline = poll.settings.deadline 
      ? new Date(poll.settings.deadline).toLocaleDateString() 
      : 'soon';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
          <h1 style="color: #92400e; margin-bottom: 16px;">⏰ Poll Response Reminder</h1>
          
          <h2 style="color: #1e293b; margin-bottom: 12px;">${poll.title}</h2>
          
          <p style="color: #374151; margin-bottom: 16px;">
            We haven't received your response to this poll yet. Please take a moment to let us know your availability.
          </p>
          
          <div style="background-color: #fef3c7; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <p style="color: #92400e; margin: 0; font-weight: 600;">
              ⚡ Response needed by: ${deadline}
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://rehearsal-scheduler.onrender.com'}/polls" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📝 Respond Now
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Your response helps us coordinate the best schedule for everyone.
          </p>
        </div>
      </div>
    `;
  }

  generateRehearsalScheduledHTML(rehearsal) {
    const actorsList = rehearsal.actors.map(actor => 
      `<li>${actor.name}${rehearsal.actorRequirements ? 
        (rehearsal.actorRequirements.find(req => req.actorId === actor.id)?.isRequired ? ' (Required)' : ' (Optional)') 
        : ''}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
          <h1 style="color: #065f46; margin-bottom: 16px;">🎭 Rehearsal Scheduled</h1>
          
          <h2 style="color: #1e293b; margin-bottom: 12px;">${rehearsal.title}</h2>
          
          ${rehearsal.description ? `<p style="color: #64748b; margin-bottom: 16px;">${rehearsal.description}</p>` : ''}
          
          <div style="background-color: #f0fdf4; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <p style="color: #065f46; margin: 0 0 8px 0; font-weight: 600;">
              📅 Date: ${rehearsal.date}
            </p>
            <p style="color: #065f46; margin: 0 0 8px 0; font-weight: 600;">
              🕐 Time: ${rehearsal.time.start} - ${rehearsal.time.end}
            </p>
            <p style="color: #065f46; margin: 0; font-weight: 600;">
              🎬 Scene: ${rehearsal.scene}
            </p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <h3 style="color: #1e293b; margin-bottom: 12px;">Cast Members:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              ${actorsList}
            </ul>
          </div>
          
          ${rehearsal.subsetParticipation?.enabled ? `
            <div style="background-color: #eff6ff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
              <p style="color: #1d4ed8; margin: 0; font-weight: 500;">
                ℹ️ This rehearsal supports flexible attendance. 
                Minimum ${rehearsal.subsetParticipation.minRequiredActors} actors needed.
              </p>
            </div>
          ` : ''}
          
          <p style="color: #374151; margin-bottom: 20px;">
            Please mark this rehearsal in your calendar and prepare accordingly. 
            If you cannot attend, please contact the director as soon as possible.
          </p>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://rehearsal-scheduler.onrender.com'}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📅 View Schedule
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Rehearsal Scheduler - Keeping your production on track
          </p>
        </div>
      </div>
    `;
  }

  generateRehearsalReminderHTML(rehearsal) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
          <h1 style="color: #92400e; margin-bottom: 16px;">🔔 Rehearsal Reminder</h1>
          
          <h2 style="color: #1e293b; margin-bottom: 12px;">${rehearsal.title}</h2>
          
          <div style="background-color: #fef3c7; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 600;">
              📅 Tomorrow: ${rehearsal.date}
            </p>
            <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 600;">
              🕐 Time: ${rehearsal.time.start} - ${rehearsal.time.end}
            </p>
            <p style="color: #92400e; margin: 0; font-weight: 600;">
              🎬 Scene: ${rehearsal.scene}
            </p>
          </div>
          
          <p style="color: #374151; margin-bottom: 20px;">
            Don't forget about tomorrow's rehearsal! Please arrive a few minutes early and come prepared.
          </p>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://rehearsal-scheduler.onrender.com'}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📅 View Full Schedule
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            See you at rehearsal!
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();