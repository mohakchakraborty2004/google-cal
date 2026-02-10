import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

function getCalendarService() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured')
  }
  
  const credentials = JSON.parse(credentialsJson)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })
  
  return google.calendar({ version: 'v3', auth })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const calendarId = process.env.CALENDAR_ID || 'primary'
    
    const calendar = getCalendarService()
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: start || new Date().toISOString(),
      timeMax: end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })
    
    const events = response.data.items?.map(event => ({
      id: event.id,
      title: event.summary || 'Busy',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description,
      location: event.location,
      backgroundColor: '#4285f4',
      borderColor: '#1a73e8',
    })) || []
    
    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, start, end, description, attendees } = body
    const calendarId = process.env.CALENDAR_ID || 'primary'
    const timezone = process.env.TIMEZONE || 'America/Los_Angeles'
    
    const calendar = getCalendarService()
    
    // Check for conflicts
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: start,
        timeMax: end,
        timeZone: timezone,
        items: [{ id: calendarId }],
      },
    })
    
    const busyTimes = freeBusyResponse.data.calendars?.[calendarId]?.busy || []
    if (busyTimes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'conflict',
        message: 'This time slot is already booked',
        conflicting_periods: busyTimes,
      }, { status: 409 })
    }
    
    // Create event
    const event = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary: title,
        description,
        start: { dateTime: start, timeZone: timezone },
        end: { dateTime: end, timeZone: timezone },
        attendees: attendees?.map((email: string) => ({ email })),
      },
    })
    
    return NextResponse.json({
      success: true,
      event: {
        id: event.data.id,
        title: event.data.summary,
        start: event.data.start?.dateTime,
        end: event.data.end?.dateTime,
        link: event.data.htmlLink,
      },
    })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const calendarId = process.env.CALENDAR_ID || 'primary'
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }
    
    const calendar = getCalendarService()
    
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
