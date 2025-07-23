import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useApp } from '../contexts/AppContext';
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

interface Tooltip {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onSelectionChange, initialSelections = [] }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip>({ x: 0, y: 0, content: '', visible: false });
  const { actors } = useApp();

  // Debug logging
  useEffect(() => {
    console.log('🔧 WeeklyPlanner: Component initialized with props:', {
      initialSelections,
      actorsCount: actors?.length || 0,
      weeklyAvailabilitiesCount: weeklyAvailabilities.length
    });
  }, [initialSelections, actors, weeklyAvailabilities]);

  // Helper function to get actors available during a specific time slot
  const getActorsAvailableForTimeSlot = useCallback((slotStart: Date): string[] => {
    if (!actors || actors.length === 0) {
      return [];
    }

    const day = getDay(slotStart);
    const slotTime = format(slotStart, 'h:mm a');
    const slotEndTime = format(new Date(slotStart.getTime() + 30 * 60000), 'h:mm a');

    // Check if the time slot is within any weekly availability period
    const isSlotAvailable = weeklyAvailabilities.some(avail => {
      if (avail.dayOfWeek !== day) return false;
      return slotTime >= avail.startTime && slotEndTime <= avail.endTime;
    });

    if (!isSlotAvailable) {
      return [];
    }

    // For now, we'll assume all actors are potentially available during admin-defined periods
    // In a real system, this would check each actor's individual availability
    const availableActors = actors.filter(actor => {
      // Check if actor has old-style timeslot availability that matches this time
      if (actor.availableTimeslots && actor.availableTimeslots.length > 0) {
        // This is legacy logic for backward compatibility
        return true; // For now, include all actors during available periods
      }
      
      // Check if actor has individual availability data (if it exists)
      if (actor.availability && Array.isArray(actor.availability)) {
        // Check if any of the actor's availability slots overlap with this time slot
        return actor.availability.some((availableSlot: string) => {
          try {
            const slotDate = new Date(availableSlot);
            const slotDateEnd = new Date(slotDate.getTime() + 30 * 60000);
            return slotStart >= slotDate && slotStart < slotDateEnd;
          } catch {
            return false;
          }
        });
      }

      // If no specific availability data, assume available during admin periods
      return true;
    });

    return availableActors.map(actor => actor.name);
  }, [actors, weeklyAvailabilities]);

  useEffect(() => {
    const initialEvents = initialSelections.map(s => ({ start: new Date(s), end: new Date(new Date(s).getTime() + 30 * 60000), title: 'Available' }));
    setEvents(initialEvents);
  }, [initialSelections]);

  useEffect(() => {
    const fetchAndSetAvailabilities = async () => {
      try {
        const availabilities = await ApiService.getWeeklyAvailabilities();
        console.log('📅 WeeklyPlanner: Fetched availabilities:', availabilities);
        setWeeklyAvailabilities(availabilities);
      } catch (error) {
        console.error('❌ WeeklyPlanner: Error fetching weekly availabilities:', error);
      }
    };
    fetchAndSetAvailabilities();
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    const day = getDay(start);
    console.log('📅 WeeklyPlanner: Slot selected:', { day, start, end, availableSlots: weeklyAvailabilities });
    
    // Check if this slot is within admin-defined weekly availability periods
    const isAvailable = weeklyAvailabilities.some(avail => {
      if (avail.dayOfWeek !== day) return false;
      const startTime = parse(avail.startTime, 'HH:mm', new Date());
      const endTime = parse(avail.endTime, 'HH:mm', new Date());
      const slotStartTime = parse(format(start, 'HH:mm'), 'HH:mm', new Date());
      const slotEndTime = parse(format(end, 'HH:mm'), 'HH:mm', new Date());
      return slotStartTime >= startTime && slotEndTime <= endTime;
    });

    console.log('📅 WeeklyPlanner: Is slot available?', isAvailable);

    if (isAvailable) {
      // Check if this slot is already selected
      const existingEventIndex = events.findIndex(event => 
        event.start && event.start.getTime() === start.getTime()
      );

      let updatedEvents;
      if (existingEventIndex >= 0) {
        // Slot is already selected - remove it (toggle off)
        updatedEvents = events.filter((_, index) => index !== existingEventIndex);
        console.log('📅 WeeklyPlanner: Removed existing slot');
      } else {
        // Slot is not selected - add it (toggle on)
        const newEvent = { start, end, title: 'Available' };
        updatedEvents = [...events, newEvent];
        console.log('📅 WeeklyPlanner: Added new slot');
      }
      
      setEvents(updatedEvents);
      onSelectionChange(updatedEvents.map(e => e.start as Date));
    } else {
      console.log('📅 WeeklyPlanner: Slot not available - outside admin-defined availability periods');
    }
  }, [events, onSelectionChange, weeklyAvailabilities]);

  // Handle mouse events for tooltip
  const handleSlotMouseEnter = useCallback((slotInfo: any, event: React.MouseEvent) => {
    if (slotInfo && slotInfo.start) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const availableActors = getActorsAvailableForTimeSlot(slotInfo.start);
      
      const tooltipContent = availableActors.length > 0 
        ? `Available actors: ${availableActors.join(', ')}` 
        : 'No actors available';
      
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        content: tooltipContent,
        visible: true
      });
    }
  }, [getActorsAvailableForTimeSlot]);

  const handleSlotMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // Custom Event component to handle click-to-remove
  const CustomEvent = useCallback(({ event }: any) => {
    const handleEventClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🎯 CustomEvent: Event clicked for removal:', event);
      
      // Remove this event when clicked
      const updatedEvents = events.filter(existingEvent => 
        existingEvent.start?.getTime() !== event.start?.getTime()
      );
      console.log('🗑️ CustomEvent: Removing event, updated events:', updatedEvents.length);
      setEvents(updatedEvents);
      onSelectionChange(updatedEvents.map(e => e.start as Date));
    };

    return (
      <div 
        onClick={handleEventClick}
        onMouseDown={handleEventClick} // Try mouseDown as backup
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: '#6366f1',
          color: 'white',
          borderRadius: '4px',
          border: '1px solid #4f46e5',
          userSelect: 'none',
        }}
        title="Click to remove availability"
      >
        ✓ Available
      </div>
    );
  }, [events, onSelectionChange]);

  // Custom TimeSlot component to handle hover events
  const CustomTimeSlot = useCallback(({ value, resource, ...props }: any) => {
    return (
      <div
        {...props}
        onMouseEnter={(event) => handleSlotMouseEnter({ start: value }, event)}
        onMouseLeave={handleSlotMouseLeave}
        style={{ 
          ...props.style, 
          cursor: 'pointer',
          height: '100%'
        }}
      />
    );
  }, [handleSlotMouseEnter, handleSlotMouseLeave]);

  return (
    <div style={{ height: 500, position: 'relative' }}>
      <style>{`
        .rbc-time-slot:hover {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }
        .rbc-day-slot:hover {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }
        .rbc-event {
          background-color: #6366f1 !important;
          border: 2px solid #4f46e5 !important;
          border-radius: 6px !important;
          color: white !important;
          font-weight: 600 !important;
          opacity: 0.9 !important;
        }
        .rbc-event:hover {
          background-color: #4f46e5 !important;
          opacity: 1 !important;
          cursor: pointer !important;
        }
        .rbc-selected {
          background-color: rgba(99, 102, 241, 0.2) !important;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event: any) => {
          console.log('📅 Calendar: Event selected for removal:', event);
          // Remove the selected event
          const updatedEvents = events.filter(existingEvent => 
            existingEvent.start?.getTime() !== event.start?.getTime()
          );
          setEvents(updatedEvents);
          onSelectionChange(updatedEvents.map(e => e.start as Date));
        }}
        defaultView="week"
        step={30}
        timeslots={1}
        components={{
          timeSlotWrapper: CustomTimeSlot,
          event: CustomEvent,
        }}
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {tooltip.content}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 0, 0, 0.8)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;
