// Email service for sending auto-responder emails
// This uses Resend.com for reliable email delivery

export class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY
    this.baseUrl = 'https://api.resend.com'
  }

  async sendWelcomeEmail(name, email) {
    if (!this.apiKey) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const htmlContent = this.getWelcomeEmailHTML(name)
    const textContent = this.getWelcomeEmailText(name)

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'April Sabral <apriljsabral@gmail.com>',
          to: [email],
          subject: 'Welcome to the Design District Chamber of Commerce!',
          html: htmlContent,
          text: textContent,
          reply_to: 'apriljsabral@gmail.com'
        })
      })

      const result = await response.json()

      if (response.ok) {
        return { 
          success: true, 
          messageId: result.id,
          message: 'Welcome email sent successfully' 
        }
      } else {
        console.error('Resend API error:', result)
        return { 
          success: false, 
          error: result.message || 'Failed to send email' 
        }
      }
    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  getWelcomeEmailHTML(name) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Design District Chamber</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0f0f0f 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #d4af37; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .tagline { color: #ccc; font-size: 14px; }
        .content { padding: 40px 30px; }
        .welcome-title { color: #d4af37; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
        .text { font-size: 16px; line-height: 1.7; margin-bottom: 25px; }
        .highlights { background: #f8f6f0; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #d4af37; }
        .highlight-item { margin-bottom: 12px; font-size: 15px; }
        .highlight-item strong { color: #d4af37; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4f1e8 100%); color: #000; padding: 15px 30px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-text { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">DESIGN DISTRICT</div>
            <div class="tagline">Chamber of Commerce</div>
        </div>
        
        <div class="content">
            <h1 class="welcome-title">Welcome to Our Community!</h1>
            
            <p class="text">Dear ${name},</p>
            
            <p class="text">Thank you for joining our waitlist! We're thrilled to have you as part of a growing community of business leaders shaping Miami's Design District.</p>
            
            <div class="highlights">
                <div class="highlight-item"><strong>🤝 Exclusive networking</strong> with fellow business leaders</div>
                <div class="highlight-item"><strong>📈 Business growth opportunities</strong> and mentorship</div>
                <div class="highlight-item"><strong>🎯 Premium events</strong> and insider industry insights</div>
                <div class="highlight-item"><strong>🔑 Early access</strong> to our proprietary Design District Connect platform</div>
            </div>
            
            <p class="text">As a waitlist member, you'll be the first to know about our official launch, early-bird pricing, and upcoming opportunities.</p>
            
            <p class="text">Stay tuned—exciting updates are coming soon!</p>
            
            <div style="text-align: center;">
                <a href="https://miamidesigndistrictchamberofcommerce.org/about-us.html" class="cta-button">Learn About Our Leadership</a>
            </div>
            
            <p class="text">
                Best regards,<br><br>
                <strong>April Sabral</strong><br>
                Executive Director<br>
                Design District Chamber of Commerce
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Design District Chamber of Commerce<br>
                Miami Design District | info@designdistrictchamber.org
            </p>
        </div>
    </div>
</body>
</html>`
  }

  getWelcomeEmailText(name) {
    return `Dear ${name},

Thank you for joining our waitlist! We're thrilled to have you as part of a growing community of business leaders shaping Miami's Design District.

Here's what you can look forward to:

• Exclusive networking with fellow business leaders
• Business growth opportunities and mentorship  
• Premium events and insider industry insights
• Early access to our proprietary Design District Connect platform

As a waitlist member, you'll be the first to know about our official launch, early-bird pricing, and upcoming opportunities.

Stay tuned—exciting updates are coming soon!

Best regards,
April Sabral
Executive Director
Design District Chamber of Commerce

---
Design District Chamber of Commerce
Miami Design District | info@designdistrictchamber.org`
  }
}

export const emailService = new EmailService()