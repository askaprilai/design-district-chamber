// Test endpoint for Supabase database connection
import { supabaseAdmin } from '../lib/supabase.js'

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

  const { test, name, email } = req.body

  try {
    switch (test) {
      case 'connection':
        return await testConnection(res)
      case 'schema':
        return await testSchema(res)
      case 'insert':
        return await testInsert(res, name, email)
      case 'email_template':
        return await testEmailTemplate(res)
      default:
        return res.status(400).json({ error: 'Invalid test type' })
    }
  } catch (error) {
    console.error('Test error:', error)
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    })
  }
}

async function testConnection(res) {
  const startTime = Date.now()
  
  try {
    // Simple query to test connection
    const { data, error } = await supabaseAdmin
      .from('chamber_waitlist')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    const connectionTime = Date.now() - startTime

    return res.status(200).json({
      success: true,
      database: 'Design District Chamber Database',
      connectionTime,
      timestamp: new Date().toISOString(),
      message: 'Database connection successful'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check your Supabase URL and service role key'
    })
  }
}

async function testSchema(res) {
  try {
    // Check if required tables exist
    const requiredTables = ['chamber_waitlist', 'email_templates', 'email_logs']
    const tableInfo = []

    for (const tableName of requiredTables) {
      try {
        // Get table info
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(0) // Don't return data, just check if table exists

        if (!error) {
          // Get column count (this is a simplified check)
          const { data: sampleRow } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(1)

          tableInfo.push({
            table_name: tableName,
            exists: true,
            column_count: sampleRow && sampleRow.length > 0 ? Object.keys(sampleRow[0]).length : 'Unknown'
          })
        }
      } catch (tableError) {
        tableInfo.push({
          table_name: tableName,
          exists: false,
          error: tableError.message
        })
      }
    }

    const missingTables = tableInfo.filter(t => !t.exists).map(t => t.table_name)

    if (missingTables.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required tables',
        missingTables,
        tables: tableInfo
      })
    }

    return res.status(200).json({
      success: true,
      tables: tableInfo.filter(t => t.exists),
      message: 'All required tables found'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Schema validation failed'
    })
  }
}

async function testInsert(res, name, email) {
  try {
    // Insert test entry
    const { data, error } = await supabaseAdmin
      .from('chamber_waitlist')
      .insert({
        name: name || 'Test User',
        email: email || `test+${Date.now()}@example.com`,
        referral_source: 'database_test'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return res.status(200).json({
      success: true,
      entryId: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.created_at,
      message: 'Test entry inserted successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Insert permission test failed - check RLS policies'
    })
  }
}

async function testEmailTemplate(res) {
  try {
    // Check if email template exists
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_type', 'welcome')
      .eq('is_active', true)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Welcome email template not found',
        details: 'Make sure the SQL schema was run completely'
      })
    }

    return res.status(200).json({
      success: true,
      template: {
        name: data.name,
        subject: data.subject,
        template_type: data.template_type,
        is_active: data.is_active,
        created_at: data.created_at
      },
      message: 'Welcome email template found'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Email template check failed'
    })
  }
}