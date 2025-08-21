// Chamber waitlist API - Saves to both Notion & Supabase + sends auto-responder
import { Client } from '@notionhq/client'
import { supabaseAdmin } from '../lib/supabase.js'
import { emailService } from '../lib/email-service.js'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY
})

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

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
    const { name, email, company } = req.body

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required',
        success: false 
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        success: false 
      })
    }

    console.log('Processing waitlist signup:', { name, email, company })

    // 1. Check for duplicates in Supabase
    const { data: existingEntry, error: checkError } = await supabaseAdmin
      .from('chamber_waitlist')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        message: 'This email is already on our waitlist'
      })
    }

    // 2. Save to Supabase first
    const { data: supabaseData, error: supabaseError } = await supabaseAdmin
      .from('chamber_waitlist')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company_name: company?.trim() || null,
        referral_source: 'chamber_website',
        status: 'active',
        subscribed_to_updates: true
      })
      .select()
      .single()

    if (supabaseError) {
      console.error('Supabase error:', supabaseError)
      return res.status(500).json({
        success: false,
        error: 'Database error',
        details: supabaseError.message
      })
    }

    console.log('✅ Saved to Supabase:', supabaseData.id)

    // 3. Save to Notion (parallel to email sending)
    let notionSuccess = false
    try {
      if (NOTION_DATABASE_ID) {
        const notionResponse = await notion.pages.create({
          parent: {
            database_id: NOTION_DATABASE_ID
          },
          properties: {
            'Name': {
              title: [{ text: { content: name.trim() } }]
            },
            'Email': {
              email: email.toLowerCase().trim()
            },
            'Company': {
              rich_text: [{ text: { content: company?.trim() || '' } }]
            },
            'Source': {
              select: { name: 'Chamber Website' }
            },
            'Status': {
              select: { name: 'New' }
            },
            'Date Added': {
              date: { start: new Date().toISOString() }
            }
          }
        })
        notionSuccess = true
        console.log('✅ Saved to Notion:', notionResponse.id)
      }
    } catch (notionError) {
      console.error('⚠️ Notion save failed (non-critical):', notionError.message)
      // Don't fail the whole request if Notion fails
    }

    // 4. Send auto-responder email
    let emailSent = false
    let emailDetails = 'Email service not configured'
    
    try {
      const emailResult = await emailService.sendWelcomeEmail(name.trim(), email.toLowerCase().trim())
      
      if (emailResult.success) {
        emailSent = true
        emailDetails = emailResult.message
        console.log('✅ Auto-responder sent:', emailResult.messageId)

        // Update Supabase record to mark email as sent
        await supabaseAdmin
          .from('chamber_waitlist')
          .update({
            auto_responder_sent: true,
            auto_responder_sent_at: new Date().toISOString()
          })
          .eq('id', supabaseData.id)

      } else {
        emailDetails = emailResult.error
        console.error('❌ Email failed:', emailResult.error)
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError.message)
      emailDetails = emailError.message
    }

    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully joined waitlist!',
      data: {
        id: supabaseData.id,
        name: supabaseData.name,
        email: supabaseData.email,
        company: supabaseData.company_name,
        timestamp: supabaseData.created_at,
        saved_to_supabase: true,
        saved_to_notion: notionSuccess,
        email_sent: emailSent,
        email_details: emailDetails
      }
    })

  } catch (error) {
    console.error('❌ Waitlist API Error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.',
      details: error.message
    })
  }
}