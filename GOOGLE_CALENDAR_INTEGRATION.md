# Google Calendar Smart Availability Integration

## Overview

This enhancement adds intelligent Google Calendar integration to the Rehearsal Scheduler app. Instead of manually selecting available timeslots, users can now connect their Google Calendar and the app will automatically determine their availability by checking for conflicts with existing calendar events.

## How It Works

### 1. **Connect Google Calendar**
- Users authenticate with Google OAuth
- App gains read-only access to their primary calendar
- Google email is stored with their profile

### 2. **Automatic Availability Analysis**
- App retrieves calendar events for the next 30 days (configurable)
- For each rehearsal timeslot (e.g., "Monday 2:00 PM - 4:00 PM"):
  - Finds all occurrences of that day/time in the date range
  - Checks each occurrence against calendar events for conflicts
  - Calculates availability percentage based on free vs. busy occurrences

### 3. **Smart Availability Determination**
- **Available**: More than 50% of occurrences are conflict-free
- **Not Available**: 50% or more occurrences have calendar conflicts
- User's profile is automatically updated with available timeslots

### 4. **Detailed Conflict Information**
- Shows exactly which dates have conflicts
- Lists the conflicting calendar events
- Provides next available date for unavailable slots

## Technical Implementation

### Backend Changes

#### New API Endpoint: `POST /api/calendar/check-timeslots`
```javascript
// Request body
{
  "timeslots": [
    {
      "id": "mon-2pm-4pm",
      "label": "Mon, 2:00 PM - 4:00 PM", 
      "day": "Monday",
      "startTime": "2:00 PM",
      "endTime": "4:00 PM"
    }
  ],
  "dateRange": 30  // days to check (optional, default 30)
}

// Response
{
  "timeslots": [
    {
      "id": "mon-2pm-4pm",
      "label": "Mon, 2:00 PM - 4:00 PM",
      "isAvailable": true,
      "availability": 0.75,  // 75% available
      "totalDays": 4,
      "totalAvailableDays": 3,
      "conflicts": [
        {
          "date": "Mon Jul 07 2025",
          "conflictingEvents": [
            {
              "summary": "Team Meeting",
              "start": "2025-07-07T14:00:00.000Z",
              "end": "2025-07-07T15:00:00.000Z"
            }
          ]
        }
      ],
      "nextAvailableDate": "Mon Jul 14 2025"
    }
  ],
  "updatedAvailability": true,
  "availableTimeslotIds": ["mon-2pm-4pm"],
  "message": "Availability updated based on Google Calendar. 1/1 timeslots are available."
}
```

#### Enhanced Google Calendar Service
- `checkTimeslotAvailability()`: Main function to analyze timeslots
- `checkSingleTimeslotAvailability()`: Detailed analysis for one timeslot
- Smart time parsing (handles "2:00 PM" format)
- Conflict detection algorithm
- Automatic profile updates

### Frontend Changes

#### Updated API Service
- New `checkTimeslotsAvailability()` method
- Enhanced error handling
- Type-safe interfaces

#### New React Component: `GoogleCalendarAvailability`
- Connection status display
- One-click availability analysis
- Visual availability results with conflict details
- Real-time updates

## User Experience

### Before (Manual)
1. User looks at their calendar
2. Manually selects available timeslots in app
3. Risk of forgetting about conflicts
4. Outdated as calendar changes

### After (Automatic)
1. User connects Google Calendar once
2. Clicks "Check All Timeslots Against Calendar"
3. App automatically determines true availability
4. Profile updated instantly
5. Directors see accurate, up-to-date availability

## Example Scenarios

### Scenario 1: Business User
**Timeslot**: Monday 2:00 PM - 4:00 PM
**Calendar Events**: 
- July 7: Team Meeting 2:00-3:00 PM
- July 14: Available (no conflicts)
- July 21: Available (no conflicts)  
- July 28: Available (no conflicts)

**Result**: 75% available (3/4 occurrences free) → **Available**

### Scenario 2: Student User
**Timeslot**: Tuesday 3:00 PM - 5:00 PM  
**Calendar Events**:
- July 8: Chemistry Lab 2:00-5:00 PM
- July 15: Study Group 3:30-6:00 PM
- July 22: Available (no conflicts)
- July 29: Dentist Appointment 4:00-5:00 PM

**Result**: 25% available (1/4 occurrences free) → **Not Available**

## Benefits

### For Actors
- **Accuracy**: No more forgetting about calendar conflicts
- **Convenience**: One-click availability updates
- **Transparency**: See exactly why you're unavailable
- **Current**: Always reflects latest calendar state

### For Directors
- **Reliability**: Trust that availability is accurate
- **Planning**: Better scheduling with confident availability data
- **Efficiency**: Less back-and-forth about availability conflicts
- **Insight**: Understand why certain timeslots have low availability

### For Productions
- **Better Scheduling**: More accurate rehearsal planning
- **Reduced Conflicts**: Fewer last-minute availability changes
- **Time Savings**: Automated availability management
- **Professionalism**: Tech-forward approach to scheduling

## Security & Privacy

- **Read-Only Access**: App only reads calendar events, never modifies
- **Secure Storage**: Google tokens encrypted in database
- **Limited Scope**: Only accesses primary calendar
- **User Control**: Users can disconnect at any time
- **No Data Sharing**: Calendar events never stored or shared

## Future Enhancements

1. **Multi-Calendar Support**: Check work, personal, and other calendars
2. **Availability Preferences**: Customize availability thresholds  
3. **Smart Suggestions**: Suggest alternative timeslots based on calendar
4. **Calendar Sync**: Add rehearsals to Google Calendar automatically
5. **Team Calendar**: See cast availability in aggregate
6. **Recurring Pattern Detection**: Identify regular conflicts
7. **Buffer Time**: Account for travel time between events

## Testing

The implementation includes comprehensive testing:

- **Unit Tests**: Calendar parsing and conflict detection logic
- **Integration Tests**: End-to-end OAuth and API flow  
- **Edge Cases**: Invalid dates, timezone handling, all-day events
- **Error Handling**: Network failures, expired tokens, API limits
- **Performance**: Large calendar datasets, multiple timeslots

## Deployment Notes

- Google OAuth credentials configured for production
- CORS settings allow web and mobile access
- Rate limiting prevents API abuse
- Comprehensive error logging for troubleshooting
- Graceful fallback when Google Calendar unavailable

---

This feature transforms the Rehearsal Scheduler from a manual scheduling tool into an intelligent, calendar-aware system that provides accurate, real-time availability information for better production planning.
