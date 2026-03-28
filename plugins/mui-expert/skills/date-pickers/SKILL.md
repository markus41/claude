---
name: date-pickers
description: MUI X Date/Time Pickers setup, configuration, and form integration
triggers:
  - DatePicker
  - date picker
  - TimePicker
  - DateTimePicker
  - calendar
  - date-pickers
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.jsx"
---

# MUI X Date Pickers

## Package Installation

```bash
# Core package (free)
npm install @mui/x-date-pickers

# Pro package (requires license — DateRangePicker, DateTimeRangePicker, etc.)
npm install @mui/x-date-pickers-pro

# Choose ONE date adapter:
npm install dayjs                    # recommended — smallest, fastest
npm install date-fns                 # most popular in React ecosystem
npm install luxon                    # feature-rich, immutable
npm install moment                   # legacy; avoid for new projects
```

## Date Adapters

### dayjs (recommended)

dayjs is the recommended adapter: smallest bundle (~7 KB), fastest parse, covers all picker features.

```tsx
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Wrap your app root (or page root) — every picker must be a descendant
export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MyRoutes />
    </LocalizationProvider>
  );
}
```

### date-fns

```tsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale';   // import locale from date-fns/locale, NOT date-fns

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
  <MyRoutes />
</LocalizationProvider>
```

### luxon

```tsx
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

<LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="en-US">
  <MyRoutes />
</LocalizationProvider>
```

## Core Picker Components

### DatePicker

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

function BasicDatePicker() {
  const [value, setValue] = useState<Dayjs | null>(dayjs('2024-01-15'));

  return (
    <DatePicker
      label="Select date"
      value={value}
      onChange={(newValue) => setValue(newValue)}
    />
  );
}
```

### TimePicker

```tsx
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

function BasicTimePicker() {
  const [value, setValue] = useState<Dayjs | null>(dayjs().hour(10).minute(30));

  return (
    <TimePicker
      label="Select time"
      value={value}
      onChange={(newValue) => setValue(newValue)}
      ampm={false}                      // 24-hour format
      views={['hours', 'minutes']}      // omit 'seconds' if not needed
    />
  );
}
```

### DateTimePicker

```tsx
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

function BasicDateTimePicker() {
  const [value, setValue] = useState<Dayjs | null>(null);

  return (
    <DateTimePicker
      label="Date and time"
      value={value}
      onChange={(newValue) => setValue(newValue)}
      format="DD/MM/YYYY HH:mm"
      ampm={false}
    />
  );
}
```

### DateRangePicker (Pro — requires license)

```tsx
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange } from '@mui/x-date-pickers-pro';
import { LicenseInfo } from '@mui/x-license';

// Set license key once at app entry point
LicenseInfo.setLicenseKey('your-license-key');

function BookingPicker() {
  const [value, setValue] = useState<DateRange<Dayjs>>([null, null]);

  return (
    <DateRangePicker
      value={value}
      onChange={(newValue) => setValue(newValue)}
      localeText={{ start: 'Check-in', end: 'Check-out' }}
    />
  );
}
```

### DateTimeRangePicker (Pro)

```tsx
import { DateTimeRangePicker } from '@mui/x-date-pickers-pro/DateTimeRangePicker';

function EventTimePicker() {
  const [value, setValue] = useState<DateRange<Dayjs>>([null, null]);

  return (
    <DateTimeRangePicker
      value={value}
      onChange={setValue}
      localeText={{ start: 'Event start', end: 'Event end' }}
    />
  );
}
```

## Slots and slotProps (v6 API)

`slots` replaces `components`; `slotProps` replaces `componentsProps`. Always use the new API.

### textField slot

```tsx
import TextField from '@mui/material/TextField';

<DatePicker
  label="Birthday"
  value={value}
  onChange={setValue}
  slots={{
    textField: TextField,
  }}
  slotProps={{
    textField: {
      variant: 'outlined',
      fullWidth: true,
      helperText: 'MM/DD/YYYY',
      size: 'small',
      required: true,
    },
  }}
/>
```

### actionBar slot

```tsx
// Available actions: 'clear' | 'today' | 'cancel' | 'accept'
<DatePicker
  value={value}
  onChange={setValue}
  slotProps={{
    actionBar: {
      actions: ['clear', 'today', 'cancel', 'accept'],
    },
  }}
/>
```

### toolbar slot

```tsx
import { DatePickerToolbar } from '@mui/x-date-pickers/DatePicker';

<DatePicker
  value={value}
  onChange={setValue}
  slots={{
    toolbar: (props) => (
      <DatePickerToolbar
        {...props}
        toolbarFormat="DD MMMM YYYY"
        toolbarPlaceholder="—"
      />
    ),
  }}
/>
```

### day slot (custom day rendering)

```tsx
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import Badge from '@mui/material/Badge';

interface ServerDayProps extends PickersDayProps<Dayjs> {
  highlightedDays?: number[];
}

function ServerDay({ highlightedDays = [], day, outsideCurrentMonth, ...other }: ServerDayProps) {
  const isHighlighted = !outsideCurrentMonth && highlightedDays.includes(day.date());

  return (
    <Badge key={day.toString()} overlap="circular" badgeContent={isHighlighted ? '🔵' : undefined}>
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

// Usage
<DatePicker
  slots={{ day: ServerDay }}
  slotProps={{ day: { highlightedDays: [1, 5, 10, 15, 20] } as any }}
  value={value}
  onChange={setValue}
/>
```

## Validation

### minDate / maxDate

```tsx
<DatePicker
  label="Future only (max 1 year)"
  minDate={dayjs()}
  maxDate={dayjs().add(1, 'year')}
  value={value}
  onChange={setValue}
/>

// Restrict to a specific year range
<DatePicker
  minDate={dayjs('2000-01-01')}
  maxDate={dayjs('2030-12-31')}
  value={value}
  onChange={setValue}
/>
```

### shouldDisableDate

```tsx
// Disable weekends
<DatePicker
  shouldDisableDate={(day) => day.day() === 0 || day.day() === 6}
  value={value}
  onChange={setValue}
/>

// Disable a list of holiday dates
const holidays = [dayjs('2024-12-25'), dayjs('2024-01-01'), dayjs('2024-07-04')];
<DatePicker
  shouldDisableDate={(day) => holidays.some((h) => h.isSame(day, 'day'))}
  value={value}
  onChange={setValue}
/>

// Combined: no past dates, no weekends
<DatePicker
  shouldDisableDate={(day) => {
    const isWeekend = day.day() === 0 || day.day() === 6;
    const isPast = day.isBefore(dayjs(), 'day');
    return isWeekend || isPast;
  }}
  value={value}
  onChange={setValue}
/>
```

### shouldDisableTime

```tsx
// Business hours only: 8am–6pm
<TimePicker
  shouldDisableTime={(value, view) => {
    if (view === 'hours') return value < 8 || value > 18;
    return false;
  }}
  value={value}
  onChange={setValue}
/>

// Exclude lunch 12–13 and only 15-minute intervals
<TimePicker
  shouldDisableTime={(value, view) => {
    if (view === 'hours') return value === 12 || value === 13;
    if (view === 'minutes') return value % 15 !== 0;
    return false;
  }}
  value={value}
  onChange={setValue}
/>
```

### onError callback

```tsx
const [errorMsg, setErrorMsg] = useState<string | null>(null);

<DatePicker
  value={value}
  onChange={setValue}
  minDate={dayjs('2020-01-01')}
  maxDate={dayjs('2030-12-31')}
  onError={(reason) => {
    const messages: Record<string, string> = {
      minDate: 'Date must be on or after January 1, 2020',
      maxDate: 'Date must be before 2031',
      invalidDate: 'Please enter a valid date',
      disablePast: 'Past dates are not allowed',
      shouldDisableDate: 'This date is unavailable',
    };
    setErrorMsg(reason ? (messages[reason] ?? 'Invalid date') : null);
  }}
  slotProps={{
    textField: {
      error: !!errorMsg,
      helperText: errorMsg,
    },
  }}
/>
```

## Form Integration with React Hook Form

### Basic controlled DatePicker

```tsx
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface FormValues {
  birthDate: Dayjs | null;
}

function DateForm() {
  const {
    control,
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: { birthDate: null },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data.birthDate?.toISOString());   // ISO string for APIs
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="birthDate"
        control={control}
        rules={{
          required: 'Birth date is required',
          validate: (v) => (v?.isValid() ? true : 'Please enter a valid date'),
        }}
        render={({ field, fieldState }) => (
          <DatePicker
            label="Birth date"
            value={field.value}
            onChange={field.onChange}
            slotProps={{
              textField: {
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
                onBlur: field.onBlur,
                inputRef: field.ref,
              },
            }}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Zod + React Hook Form

```tsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  startDate: z
    .custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid(), 'Invalid date')
    .refine((v) => v.isAfter(dayjs()), 'Must be a future date'),
  endDate: z
    .custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid(), 'Invalid date'),
}).refine((d) => d.endDate.isAfter(d.startDate), {
  message: 'End must be after start',
  path: ['endDate'],
});

function ZodDateForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { startDate: null, endDate: null },
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {['startDate', 'endDate'].map((name) => (
        <Controller
          key={name}
          name={name as 'startDate' | 'endDate'}
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              label={name === 'startDate' ? 'Start' : 'End'}
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  error: !!fieldState.error,
                  helperText: fieldState.error?.message,
                },
              }}
            />
          )}
        />
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### DateRangePicker with React Hook Form

```tsx
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange } from '@mui/x-date-pickers-pro';

interface FormValues {
  period: DateRange<Dayjs>;
}

function RangeForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { period: [null, null] },
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="period"
        control={control}
        rules={{
          validate: ([start, end]) => {
            if (!start || !end) return 'Both dates are required';
            if (!start.isValid() || !end.isValid()) return 'Invalid date';
            if (end.isBefore(start)) return 'End must be after start';
            return true;
          },
        }}
        render={({ field, fieldState }) => (
          <>
            <DateRangePicker
              value={field.value}
              onChange={field.onChange}
              localeText={{ start: 'Start', end: 'End' }}
            />
            {fieldState.error && (
              <p style={{ color: 'red', fontSize: 12 }}>{fieldState.error.message}</p>
            )}
          </>
        )}
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

## Static, Mobile, and Desktop Variants

### StaticDatePicker (always visible)

```tsx
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';

function InlineCalendar() {
  const [value, setValue] = useState<Dayjs | null>(dayjs());

  return (
    <StaticDatePicker
      value={value}
      onChange={setValue}
      orientation="landscape"          // 'portrait' | 'landscape'
      slotProps={{
        actionBar: { actions: [] },    // hide OK/Cancel/Today buttons
      }}
    />
  );
}
```

### MobileDatePicker (dialog — forced)

```tsx
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

// Always uses full-screen dialog, even on desktop
<MobileDatePicker label="Mobile" value={value} onChange={setValue} />
```

### DesktopDatePicker (popover — forced)

```tsx
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

// Always uses popover, even on mobile
<DesktopDatePicker label="Desktop" value={value} onChange={setValue} />
```

### DatePicker (responsive — default, recommended)

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Automatically uses dialog on touch, popover on pointer devices
<DatePicker label="Responsive" value={value} onChange={setValue} />
```

## Localization

```tsx
import 'dayjs/locale/de';   // German
import 'dayjs/locale/fr';   // French
import 'dayjs/locale/ja';   // Japanese

<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
  <DatePicker value={value} onChange={setValue} />
</LocalizationProvider>

// Override specific button/label text
<LocalizationProvider
  dateAdapter={AdapterDayjs}
  localeText={{
    cancelButtonLabel: 'Abbrechen',
    okButtonLabel: 'Bestätigen',
    todayButtonLabel: 'Heute',
    clearButtonLabel: 'Löschen',
  }}
>
  <DatePicker value={value} onChange={setValue} />
</LocalizationProvider>
```

## Custom Input Format

```tsx
// dayjs format tokens: https://day.js.org/docs/en/display/format
<DatePicker format="DD/MM/YYYY" value={value} onChange={setValue} />
<DatePicker format="MMMM D, YYYY" value={value} onChange={setValue} />   // January 15, 2024
<DateTimePicker format="DD MMM YYYY HH:mm" value={value} onChange={setValue} />
```

## Controlled Open State

```tsx
const [open, setOpen] = useState(false);

<DatePicker
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  value={value}
  onChange={setValue}
  slotProps={{
    textField: {
      onClick: () => setOpen(true),
      InputProps: { readOnly: true },          // prevent keyboard entry
    },
    openPickerButton: { style: { display: 'none' } },  // hide redundant icon
  }}
/>
```

## onChange vs onAccept

```tsx
// onChange fires on every keystroke in the text field (value may still be invalid)
// onAccept fires only when the user confirms (clicks day in calendar or presses OK)

<DatePicker
  value={value}
  onChange={(newValue) => {
    setValue(newValue);   // keep field responsive
  }}
  onAccept={(acceptedValue) => {
    // safe to call API or trigger side effects here
    void fetchAvailability(acceptedValue?.toISOString());
  }}
/>
```

## Common Pitfalls

- Always wrap pickers in `<LocalizationProvider>` — omitting it throws at runtime.
- Use `null` (not `undefined`) as the empty value; undefined causes uncontrolled/controlled warnings.
- The `value` prop type must match the adapter: `Dayjs` for AdapterDayjs, `Date` for AdapterDateFns.
- For `date-fns`, import locale from `date-fns/locale`, not from `date-fns` root.
- Use deep imports (`@mui/x-date-pickers/DatePicker`) not barrel imports for tree-shaking.
- For SSR/Next.js, wrap picker in `<NoSsr>` or use `dynamic(() => ..., { ssr: false })` to prevent hydration mismatch.
- Pro components require a valid license key set via `LicenseInfo.setLicenseKey(...)` before first render.
- `shouldDisableDate` returning `true` for all days causes an infinite render loop — always leave some dates enabled.

---

## Advanced Patterns

### Timezone Handling

```tsx
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Display in user's timezone, store as UTC
<DateTimePicker
  value={value}
  timezone="America/New_York"
  onChange={(newValue) => {
    const utcValue = newValue?.utc().toISOString();
    saveToServer(utcValue);
  }}
/>

// System timezone (auto-detect)
<DateTimePicker timezone="system" />

// UTC
<DateTimePicker timezone="UTC" />
```

### Date Range Shortcuts (Pro)

```tsx
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';

const shortcuts = [
  { label: 'Today', getValue: () => { const t = dayjs(); return [t, t]; } },
  { label: 'This Week', getValue: () => [dayjs().startOf('week'), dayjs().endOf('week')] },
  { label: 'Last 7 Days', getValue: () => [dayjs().subtract(7, 'day'), dayjs()] },
  { label: 'Last 30 Days', getValue: () => [dayjs().subtract(30, 'day'), dayjs()] },
  { label: 'This Month', getValue: () => [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'This Year', getValue: () => [dayjs().startOf('year'), dayjs().endOf('year')] },
];

<DateRangePicker
  slotProps={{
    shortcuts: { items: shortcuts },
  }}
/>
```

### Custom Day Rendering

```tsx
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import Badge from '@mui/material/Badge';

function HighlightedDay(props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isHighlighted = !outsideCurrentMonth && highlightedDays.includes(day.date());

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isHighlighted ? '🔴' : undefined}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

<DatePicker
  slots={{ day: HighlightedDay }}
  slotProps={{ day: { highlightedDays: [1, 5, 15, 22] } as any }}
/>
```

### Custom Field Component

Replace the default TextField with a completely custom input:

```tsx
import { useDateField } from '@mui/x-date-pickers/DateField';

function CustomDateInput(props: any) {
  const { inputRef, inputProps, ...fieldProps } = useDateField(props);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CalendarIcon />
      <input ref={inputRef} {...inputProps} style={{ border: 'none', outline: 'none' }} />
    </Box>
  );
}

<DatePicker slots={{ field: CustomDateInput }} />
```

### Digital Clock for Time Picker

```tsx
import { DigitalClock } from '@mui/x-date-pickers/DigitalClock';
import { MultiSectionDigitalClock } from '@mui/x-date-pickers/MultiSectionDigitalClock';

// Single-section (scrollable list of times)
<TimePicker
  slots={{ mobilePaper: undefined }}
  slotProps={{ digitalClockItem: { sx: { fontSize: 14 } } }}
/>

// Multi-section (hours, minutes, AM/PM in columns)
<TimePicker
  viewRenderers={{
    hours: null,
    minutes: null,
  }}
/>
```

### Business Hours Validation

```tsx
<TimePicker
  shouldDisableTime={(value, view) => {
    if (view === 'hours') {
      return value.hour() < 9 || value.hour() > 17;
    }
    if (view === 'minutes') {
      // Only allow 15-min intervals
      return value.minute() % 15 !== 0;
    }
    return false;
  }}
  minTime={dayjs().set('hour', 9).set('minute', 0)}
  maxTime={dayjs().set('hour', 17).set('minute', 0)}
/>
```

### Action Bar Customization

```tsx
<DatePicker
  slotProps={{
    actionBar: {
      actions: ['clear', 'today', 'cancel', 'accept'],
      // Default: ['cancel', 'accept'] on mobile, [] on desktop
    },
  }}
/>
```
