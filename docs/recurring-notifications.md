# Recurring Notifications Feature

## Overview

The recurring notifications feature allows users to set up reminders that send notifications at regular intervals throughout the day, perfect for exercises, hydration reminders, posture checks, and other activities that need regular reinforcement.

## User Requirements Fulfilled

✅ **Regular Interval Notifications**: Users can set notifications to repeat every 15 minutes to 4 hours  
✅ **User-Selected Periods**: Multiple predefined intervals available (15m, 30m, 45m, 1h, 1.5h, 2h, 3h, 4h)  
✅ **Quiet Hours Respect**: Recurring notifications automatically respect quiet hours settings  
✅ **Exercise-Focused**: Eliminates need to create 20+ separate reminders for one activity  

## Technical Implementation

### Database Schema Changes

Added to the `Reminder` model in `prisma/schema.prisma`:

```prisma
// Recurring notification settings
isRecurring         Boolean @default(false) // Enable recurring notifications
recurringInterval   Int?    // Interval in minutes (e.g., 30, 60, 120)
recurringEndTime    String? // HH:MM format - when to stop recurring for the day
recurringStartTime  String? // HH:MM format - when to start recurring for the day
```

### Core Files Added/Modified

#### New Files Created:
- `src/lib/recurring-notifications.ts` - Core logic for recurring notifications
- `src/hooks/useRecurringNotifications.ts` - React hook for managing recurring notifications
- `src/app/test-recurring/page.tsx` - Test page for the feature
- `docs/recurring-notifications.md` - This documentation

#### Files Modified:
- `prisma/schema.prisma` - Added recurring fields to Reminder model
- `src/lib/validations.ts` - Added validation for recurring fields and intervals
- `src/components/ReminderForm.tsx` - Added UI for configuring recurring notifications
- `src/components/ReminderList.tsx` - Added display for recurring notification info

### Key Features

#### 1. Interval Configuration
- **Predefined Options**: 15m, 30m, 45m, 1h, 1.5h, 2h, 3h, 4h
- **Custom Range**: 5 minutes to 8 hours (480 minutes)
- **Validation**: Ensures sensible intervals and time ranges

#### 2. Time Range Control
- **Start Time**: When to begin recurring notifications (defaults to reminder time)
- **End Time**: When to stop recurring notifications (required)
- **Cross-Day Support**: Handles overnight time ranges

#### 3. Quiet Hours Integration
- **Automatic Respect**: Recurring notifications automatically skip quiet hours
- **Per-Reminder Settings**: Each reminder can have its own quiet hours configuration
- **Global Settings**: Respects app-wide quiet hours settings

#### 4. Schedule Calculation
- **Preview Generation**: Shows all notification times for the day
- **Count Calculation**: Displays total notifications per day
- **Next Time Prediction**: Calculates when the next notification will occur

### Usage Examples

#### Example 1: Hydration Reminder
```typescript
{
  title: "Drink Water",
  isRecurring: true,
  recurringInterval: 30, // Every 30 minutes
  recurringStartTime: "08:00",
  recurringEndTime: "22:00",
  daysOfWeek: [1,2,3,4,5,6,0], // All days
  quietHoursEnabled: true,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00"
}
```
**Result**: 28 notifications per day, every 30 minutes from 8 AM to 10 PM, skipping 11 PM to 7 AM

#### Example 2: Posture Check
```typescript
{
  title: "Check Your Posture",
  isRecurring: true,
  recurringInterval: 60, // Every hour
  recurringStartTime: "09:00",
  recurringEndTime: "17:00",
  daysOfWeek: [1,2,3,4,5], // Weekdays only
  quietHoursEnabled: false
}
```
**Result**: 8 notifications per day, every hour from 9 AM to 5 PM, weekdays only

#### Example 3: Exercise Breaks
```typescript
{
  title: "Take a Movement Break",
  isRecurring: true,
  recurringInterval: 45, // Every 45 minutes
  recurringStartTime: "10:00",
  recurringEndTime: "16:00",
  daysOfWeek: [1,2,3,4,5], // Weekdays only
  quietHoursEnabled: true
}
```
**Result**: 8 notifications per day, every 45 minutes from 10 AM to 4 PM, respecting quiet hours

### API Usage

#### Creating a Recurring Reminder
```typescript
const reminderData = {
  title: "Exercise Break",
  description: "Time for a 5-minute exercise break",
  category: "exercise",
  reminderTime: "09:00", // Initial time (used as start time if recurringStartTime not set)
  isRecurring: true,
  recurringInterval: 60, // Every hour
  recurringStartTime: "09:00",
  recurringEndTime: "17:00",
  daysOfWeek: [1,2,3,4,5], // Monday to Friday
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00"
};

// POST /api/reminders
fetch('/api/reminders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reminderData)
});
```

### UI Components

#### 1. Reminder Form Enhancement
- **Recurring Section**: Added to the "Schedule" tab
- **Toggle Switch**: Enable/disable recurring notifications
- **Interval Selector**: Dropdown with predefined intervals
- **Time Range Inputs**: Start and end time selection
- **Preview Display**: Shows calculated schedule and notification count

#### 2. Reminder List Enhancement
- **Recurring Badge**: Shows "Every Xm" for recurring reminders
- **Time Display**: Shows time range instead of single time for recurring
- **Info Panel**: Detailed recurring schedule information
- **Visual Indicators**: Special styling for recurring reminders

### Notification Logic

#### 1. Scheduling Algorithm
```typescript
function calculateRecurringTimes(startTime: string, endTime: string, interval: number): string[] {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const times: string[] = [];
  
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += interval) {
    times.push(minutesToTime(currentMinutes));
  }
  
  return times;
}
```

#### 2. Quiet Hours Check
```typescript
function shouldSendRecurringNotification(reminder: RecurringReminderConfig): boolean {
  // Check if today is in allowed days
  if (!reminder.daysOfWeek.includes(new Date().getDay())) return false;
  
  // Check quiet hours
  if (reminder.quietHoursEnabled && isWithinQuietHours(...)) return false;
  
  // Check if current time matches scheduled time
  return notificationTimes.some(time => matchesCurrentTime(time));
}
```

### Testing

#### Test Page Features
- **Live Configuration**: Real-time adjustment of recurring settings
- **Schedule Preview**: Visual display of all notification times
- **Live Scheduler**: Start/stop recurring notifications for testing
- **Immediate Testing**: Send test notifications on demand
- **Statistics Display**: Shows notifications per day, duration, etc.

#### Access Test Page
Navigate to `/test-recurring` to access the test interface.

### Performance Considerations

#### 1. Efficient Scheduling
- **Calculation Caching**: Notification times calculated once per configuration change
- **Memory Optimization**: Only active recurring reminders kept in memory
- **Background Processing**: Uses efficient interval checking (1-minute intervals in production)

#### 2. Database Optimization
- **Minimal Storage**: Only stores configuration, not individual notification instances
- **Index Efficiency**: Leverages existing reminder indexes
- **Query Optimization**: Fetches only active recurring reminders

### Future Enhancements

#### Potential Improvements
1. **Custom Intervals**: Allow users to set any minute value
2. **Smart Scheduling**: Skip lunch hours or meeting times
3. **Progressive Intervals**: Start frequent, then reduce over time
4. **Context Awareness**: Adjust based on user activity/location
5. **Batch Notifications**: Group multiple reminders into single notification

#### Integration Opportunities
1. **Calendar Integration**: Respect calendar busy times
2. **Health Data**: Integrate with fitness trackers
3. **Work Schedules**: Adjust based on work hours
4. **Sleep Patterns**: Optimize timing based on sleep data

## Conclusion

The recurring notifications feature provides a powerful and flexible way for users to maintain healthy habits throughout the day without creating numerous individual reminders. It respects user preferences for quiet times while providing the regular reinforcement needed for activities like exercise, hydration, and posture awareness.

The implementation is efficient, user-friendly, and easily extensible for future enhancements. 