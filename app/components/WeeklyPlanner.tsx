import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ApiService from '../services/api';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface WeeklyPlannerProps {
  onSelectionChange: (selectedSlots: Date[]) => void;
  initialSelections?: string[];
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onSelectionChange, initialSelections = [] }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState<any[]>([]);

  useEffect(() => {
    const initialEvents = initialSelections.map(s => ({ start: new Date(s), end: new Date(new Date(s).getTime() + 30 * 60000), title: 'Available' }));
    setEvents(initialEvents);
  }, [initialSelections]);

  useEffect(() => {
    const fetchAndSetAvailabilities = async () => {
      const availabilities = await ApiService.getWeeklyAvailabilities();
      setWeeklyAvailabilities(availabilities);
    };
    fetchAndSetAvailabilities();
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    const day = getDay(start);
    const isAvailable = weeklyAvailabilities.some(avail => {
      if (avail.dayOfWeek !== day) return false;
      const startTime = parse(avail.startTime, 'HH:mm', new Date());
      const endTime = parse(avail.endTime, 'HH:mm', new Date());
      const slotStartTime = parse(format(start, 'HH:mm'), 'HH:mm', new Date());
      const slotEndTime = parse(format(end, 'HH:mm'), 'HH:mm', new Date());
      return slotStartTime >= startTime && slotEndTime <= endTime;
    });

    if (isAvailable) {
      const newEvent = { start, end, title: 'Available' };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      onSelectionChange(updatedEvents.map(e => e.start as Date));
    }
  }, [events, onSelectionChange, weeklyAvailabilities]);

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="week"
        step={30}
        timeslots={1}
      />
    </div>
  );
};

export default WeeklyPlanner;
