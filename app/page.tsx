'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  backgroundColor?: string
  borderColor?: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  selectedTime: string
  onBook: (data: { title: string; start: string; end: string; description?: string }) => void
  isLoading: boolean
}

function BookingModal({ isOpen, onClose, selectedDate, selectedTime, onBook, isLoading }: BookingModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)

  if (!isOpen || !selectedDate) return null

  const startTime = new Date(selectedDate)
  const [hours, minutes] = selectedTime.split(':').map(Number)
  startTime.setHours(hours, minutes, 0, 0)
  
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBook({
      title: title || 'Appointment',
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      description,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Book Appointment</h2>
        <p className="text-gray-600 mb-4">
          {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Appointment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : 'Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [isBooking, setIsBooking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const calendarRef = useRef<FullCalendar>(null)
  const router = useRouter()

  const fetchEvents = async (start?: string, end?: string) => {
    try {
      const params = new URLSearchParams()
      if (start) params.set('start', start)
      if (end) params.set('end', end)
      
      const response = await fetch(`/api/calendar?${params}`)
      const data = await response.json()
      
      if (data.events) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDateClick = (info: any) => {
    setSelectedDate(info.date)
    setSelectedTime(format(info.date, 'HH:mm'))
    setBookingModal(true)
  }

  const handleBook = async (data: { title: string; start: string; end: string; description?: string }) => {
    setIsBooking(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: `Booked "${data.title}" successfully!` })
        setBookingModal(false)
        fetchEvents()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to book appointment' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to book appointment' })
    } finally {
      setIsBooking(false)
    }
  }

  const handleEventClick = async (info: any) => {
    const event = info.event
    if (confirm(`Delete "${event.title}"?`)) {
      try {
        await fetch(`/api/calendar?eventId=${event.id}`, { method: 'DELETE' })
        setMessage({ type: 'success', text: 'Event deleted' })
        fetchEvents()
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete event' })
      }
    }
  }

  const handleDatesSet = (info: any) => {
    fetchEvents(info.startStr, info.endStr)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Calendar Demo</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">Click on a time slot to book an appointment</div>
            <button
              onClick={() => router.push('/policy')}
              className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
            >
              View Policies
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className={`max-w-7xl mx-auto px-4 mt-4`}>
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              nowIndicator={true}
              height="auto"
              aspectRatio={1.8}
              slotDuration="00:30:00"
              selectable={true}
              selectMirror={true}
            />
          )}
        </div>
      </main>

      <BookingModal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onBook={handleBook}
        isLoading={isBooking}
      />
    </div>
  )
}
