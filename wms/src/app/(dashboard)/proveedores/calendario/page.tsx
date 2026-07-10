'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'arrival' | 'order' | 'delivery';
  status: string;
  supplier?: string;
  total?: number;
}

export default function CalendarioLogisticoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/purchase-orders?limit=100');
      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

        const calendarEvents: CalendarEvent[] = orders
          .filter((o: any) => o.expectedDate)
          .map((o: any) => ({
            id: o.id,
            title: o.poNumber,
            date: new Date(o.expectedDate).toISOString().split('T')[0],
            type: 'arrival' as const,
            status: o.status,
            supplier: o.supplier?.name,
            total: Number(o.total),
          }));

        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <PageHeader title="Calendario Logistico" description="Fechas estimadas de arribo de lotes" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          {/* Calendar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs text-gray-500 py-2">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                const dateStr = day.date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative p-2 min-h-[60px] rounded-lg text-left transition-colors ${
                      !day.isCurrentMonth ? 'text-gray-600' :
                      isSelected ? 'bg-brand-600/20 border border-brand-500' :
                      isToday ? 'bg-gray-800 border border-gray-700' :
                      'hover:bg-gray-800'
                    }`}
                  >
                    <span className={`text-sm ${isToday ? 'font-bold text-brand-400' : ''}`}>
                      {day.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-1">
                        {dayEvents.slice(0, 2).map((event, i) => (
                          <div key={i} className="text-[9px] bg-green-500/20 text-green-400 px-1 rounded truncate">
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-gray-500">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Llegadas para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay llegadas programadas</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.supplier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-400">S/ {event.total?.toLocaleString()}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          event.status === 'received' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Arrivals */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Proximas Llegadas</h3>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay llegadas programadas</p>
            ) : (
              <div className="space-y-2">
                {events
                  .filter(e => new Date(e.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-brand-400" />
                        <div>
                          <p className="text-sm text-white">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.supplier}</p>
                        </div>
                      </div>
                      <span className="text-sm text-brand-400">
                        {new Date(event.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
