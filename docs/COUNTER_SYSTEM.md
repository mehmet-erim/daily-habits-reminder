# Counter System Documentation

## Overview

The Counter System is a core feature of the Wellness Tracker that allows users to track daily activities like water intake, coffee consumption, steps, and other measurable activities. Each counter tracks a daily value that can be incremented, decremented, set to a specific value, or reset.

## Architecture

### Database Schema

The counter system uses the `Counter` model defined in `prisma/schema.prisma`:

```prisma
model Counter {
  id            String   @id @default(cuid())
  name          String   // "Water", "Coffee", "Steps", etc.
  unit          String   @default("count") // "count", "ml", "steps", etc.
  iconName      String?  // Lucide icon name
  color         String   @default("#3b82f6") // Hex color code
  dailyGoal     Int?     // Optional daily goal
  currentValue  Int      @default(0)
  isActive      Boolean  @default(true)
  date          String   // YYYY-MM-DD format
  reminderId    String?  // Optional reminder association
  userId        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminder Reminder? @relation(fields: [reminderId], references: [id], onDelete: SetNull)

  @@map("counters")
  @@unique([userId, name, date]) // One counter per user per day per name
  @@index([userId, date])
}
```

### Key Features

- **Daily-based tracking**: Each counter is unique per user, name, and date
- **Automatic daily reset**: New day creates new counter instances
- **Goal tracking**: Optional daily goals with progress indicators
- **Color customization**: Each counter can have a custom color
- **Icon support**: Lucide icons for visual identification
- **Reminder integration**: Counters can be linked to reminders
- **Multiple units**: Support for various measurement units

## API Endpoints

### GET /api/counters

Get today's counters for the authenticated user.

**Query Parameters:**
- `mode` (optional): "today" (default) or "names"

**Response:**
```json
{
  "counters": [
    {
      "id": "clxxxxx",
      "name": "Water",
      "unit": "glasses",
      "iconName": "droplets",
      "color": "#3b82f6",
      "dailyGoal": 8,
      "currentValue": 3,
      "isActive": true,
      "date": "2024-01-15",
      "reminderId": null,
      "userId": "clxxxxx",
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z",
      "reminder": null
    }
  ]
}
```

### POST /api/counters

Create or get a counter for today.

**Request Body:**
```json
{
  "name": "Water",
  "unit": "glasses",
  "iconName": "droplets",
  "color": "#3b82f6",
  "dailyGoal": 8,
  "reminderId": "clxxxxx" // optional
}
```

### PUT /api/counters/[id]

Update a counter value or settings.

**Query Parameters:**
- `action`: "increment", "set", "reset", or "settings"

**Request Bodies:**

Increment:
```json
{
  "amount": 1
}
```

Set value:
```json
{
  "value": 5
}
```

Reset: (no body required)

Settings:
```json
{
  "name": "Water Intake",
  "unit": "ml",
  "color": "#3b82f6",
  "dailyGoal": 2000,
  "isActive": true
}
```

### DELETE /api/counters/[id]

Soft delete a counter (sets isActive to false for all counters with the same name).

### GET /api/counters/history

Get counter history for a date range.

**Query Parameters:**
- `name`: Counter name (required)
- `startDate`: Start date in YYYY-MM-DD format (optional)
- `endDate`: End date in YYYY-MM-DD format (optional)
- `days`: Number of days to retrieve (default: 7)
- `includeStats`: Include statistics (default: false)

## Components

### CounterDisplay

Displays counter information with visual progress indicators.

**Props:**
- `counter`: Counter data object
- `showProgress`: Show progress bar (default: true)
- `showGoal`: Show goal information (default: true)
- `compact`: Use compact layout (default: false)
- `className`: Additional CSS classes

**Features:**
- Color-coded icons and progress bars
- Goal completion indicators
- Compact and full display modes
- Responsive design

### CounterButtons

Interactive buttons for counter operations.

**Props:**
- `counterId`: Counter ID
- `currentValue`: Current counter value
- `unit`: Counter unit
- `color`: Counter color
- `disabled`: Disable interactions
- `onUpdate`: Callback when counter is updated
- `className`: Additional CSS classes

**Features:**
- Increment/decrement buttons
- Quick increment buttons (+5, +10)
- Inline value editing
- Reset with confirmation
- Loading states

### CountersSection

Complete counter management section for the dashboard.

**Props:**
- `userId`: User ID

**Features:**
- Counter creation dialog
- Statistics summary
- Counter list with actions
- Empty state handling
- Error handling

## Utilities

### counter-utils.ts

Core utility functions for counter operations:

#### Key Functions

- `getTodayDate()`: Get today's date in YYYY-MM-DD format
- `getOrCreateCounter()`: Get existing or create new counter for today
- `getTodayCounters()`: Get all active counters for today
- `incrementCounter()`: Increment counter value
- `setCounterValue()`: Set counter to specific value
- `resetCounter()`: Reset counter to 0
- `getCounterHistory()`: Get counter history for date range
- `getCounterStats()`: Calculate counter statistics
- `updateCounterSettings()`: Update counter configuration

## Hooks

### useCounters

Custom hook for counter management.

**Returns:**
- `counters`: Array of counter data
- `loading`: Loading state
- `error`: Error message
- `refetch`: Refetch counters
- `createCounter`: Create new counter
- `updateCounter`: Update counter value
- `deleteCounter`: Delete counter

**Usage:**
```tsx
const { counters, loading, createCounter, updateCounter } = useCounters();
```

### useCounterActions

Helper hook for counter-specific actions.

**Parameters:**
- `counterId`: Counter ID
- `onUpdate`: Update callback

**Returns:**
- `increment`: Increment counter
- `decrement`: Decrement counter
- `setValue`: Set specific value
- `reset`: Reset counter

## Validation

Counter validation uses Zod schemas defined in `validations.ts`:

- `createCounterSchema`: Validate counter creation
- `updateCounterSettingsSchema`: Validate counter updates
- `incrementCounterSchema`: Validate increment operations
- `setCounterValueSchema`: Validate value setting
- `counterHistoryQuerySchema`: Validate history queries

## Supported Units

The system supports various measurement units:

- `count` (default)
- `ml`, `l` (liquids)
- `cups`, `glasses` (containers)
- `steps` (activity)
- `minutes`, `hours` (time)
- `pages` (reading)
- `calories` (nutrition)
- `grams`, `kg`, `lbs` (weight)
- `reps`, `sets` (exercise)

## Icons

The system supports Lucide icons for visual identification:

- `droplets` (water)
- `coffee` (coffee/beverages)
- `footprints` (steps/walking)
- `clock` (time-based activities)
- `book` (reading)
- `dumbbell` (exercise)
- `heart` (health)
- `pill` (medication)
- `apple` (nutrition)
- `moon` (sleep)
- `target` (goals)
- `activity` (general activity)

## Daily Reset Logic

Counters automatically reset daily through the unique constraint:
- `@@unique([userId, name, date])`
- Each day creates new counter instances
- Historical data is preserved
- Old counters can be cleaned up with maintenance scripts

## Security

- All API endpoints require authentication
- Users can only access their own counters
- Input validation on all operations
- SQL injection prevention through Prisma
- XSS prevention through proper sanitization

## Performance Considerations

- Indexes on `[userId, date]` for fast queries
- Pagination for historical data
- Optimistic updates in UI
- Efficient database queries with Prisma
- Optional cleanup of old counter data

## Error Handling

- Comprehensive error messages
- Graceful degradation on failures
- Loading states during operations
- Retry mechanisms where appropriate
- User-friendly error displays

## Testing

Test the counter system:

1. Visit `/test-counters` page
2. Create new counters
3. Test increment/decrement operations
4. Test goal completion
5. Test reset functionality
6. Test counter deletion

## Future Enhancements

Potential improvements:
- Counter templates
- Bulk operations
- Data export/import
- Advanced analytics
- Social sharing
- Reminder integration improvements
- Custom formulas for complex counting
- Integration with external APIs (fitness trackers, etc.)

## Usage Examples

### Basic Counter Creation
```tsx
const { createCounter } = useCounters();

await createCounter({
  name: "Water",
  unit: "glasses",
  iconName: "droplets",
  color: "#3b82f6",
  dailyGoal: 8
});
```

### Counter Operations
```tsx
const { increment, setValue, reset } = useCounterActions(counterId);

// Increment by 1
await increment();

// Increment by specific amount
await increment(5);

// Set to specific value
await setValue(10);

// Reset to 0
await reset();
```

### Display Counter
```tsx
<CounterDisplay 
  counter={counterData} 
  showProgress={true}
  showGoal={true}
  compact={false}
/>
```

This documentation provides a complete overview of the counter system implementation, covering all aspects from database design to UI components and usage patterns. 