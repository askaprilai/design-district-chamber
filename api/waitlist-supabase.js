// Supabase waitlist API with auto-responder email
import { supabaseAdmin } from '../lib/supabase.js'
import { emailService } from '../lib/email-service.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, phone, company_name, interest_areas, membership_tier, referral_source } = req.body

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    console.log('Adding to waitlist:', { name, email, company_name })

    // Check if email already exists
    const { data: existingEntry, error: checkError } = await supabaseAdmin
      .from('chamber_waitlist')
      .select('id, name, email')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing email:', checkError)
      return res.status(500).json({ error: 'Database error during email check' })
    }

    if (existingEntry) {
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'This email is already on our waitlist. Thank you for your interest!' 
      })
    }

    // Insert into waitlist
    const { data: waitlistEntry, error: insertError } = await supabaseAdmin
      .from('chamber_waitlist')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        company_name: company_name?.trim() || null,
        interest_areas: interest_areas || null,
        membership_tier: membership_tier || null,
        referral_source: referral_source || 'website'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting waitlist entry:', insertError)
      return res.status(500).json({ 
        error: 'Failed to add to waitlist',
        details: insertError.message 
      })
    }

    console.log('Successfully added to waitlist:', waitlistEntry.id)

    // Send welcome email
    let emailResult = null
    try {
      emailResult = await emailService.sendWelcomeEmail(name, email)
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully:', emailResult.messageId)
        
        // Update waitlist entry to mark email as sent
        await supabaseAdmin
          .from('chamber_waitlist')
          .update({ 
            auto_responder_sent: true,
            auto_responder_sent_at: new Date().toISOString()
          })
          .eq('id', waitlistEntry.id)

        // Log the email send
        await supabaseAdmin
          .from('email_logs')
          .insert({
            waitlist_id: waitlistEntry.id,
            email_address: email,
            subject: 'Welcome to the Design District Chamber of Commerce!',
            status: 'sent',
            provider_message_id: emailResult.messageId
          })
      } else {
        console.error('Failed to send welcome email:', emailResult.error)
        
        // Log the email failure
        await supabaseAdmin
          .from('email_logs')
          .insert({
            waitlist_id: waitlistEntry.id,
            email_address: email,
            subject: 'Welcome to the Design District Chamber of Commerce!',
            status: 'failed',
            error_message: emailResult.error
          })
      }
    } catch (emailError) {
      console.error('Email service error:', emailError)
      // Don't fail the entire request if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully added to waitlist',
      id: waitlistEntry.id,
      email_sent: emailResult?.success || false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}