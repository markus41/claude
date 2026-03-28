---
name: forms-validation
description: MUI form patterns with validation and library integration
triggers:
  - form
  - validation
  - TextField
  - FormControl
  - react-hook-form
  - formik
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

# MUI Forms and Validation

## Controlled vs Uncontrolled Patterns

### Controlled (recommended for most cases)

State lives in React. Every keystroke triggers a re-render; use for small-to-medium forms.

```tsx
function ControlledForm() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    // submit...
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null); // clear error on change
        }}
        error={!!error}
        helperText={error}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Submit
      </Button>
    </Box>
  );
}
```

### Uncontrolled with refs

Use for very large forms where performance matters, or when integrating with non-React code.

```tsx
function UncontrolledForm() {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: nameRef.current?.value,
      email: emailRef.current?.value,
    };
    // submit data
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField label="Name" inputRef={nameRef} fullWidth margin="normal" />
      <TextField label="Email" type="email" inputRef={emailRef} fullWidth margin="normal" />
      <Button type="submit" variant="contained">Submit</Button>
    </Box>
  );
}
```

---

## TextField Error and Helper Text Patterns

```tsx
// error flag turns label and border red; helperText shows message below
<TextField
  label="Password"
  type="password"
  error={password.length > 0 && password.length < 8}
  helperText={
    password.length > 0 && password.length < 8
      ? 'Password must be at least 8 characters'
      : 'Use a strong, unique password'
  }
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  fullWidth
/>

// Character counter in helperText
<TextField
  label="Bio"
  multiline
  rows={3}
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  inputProps={{ maxLength: 200 }}
  helperText={`${bio.length}/200`}
  FormHelperTextProps={{ sx: { textAlign: 'right' } }}
  fullWidth
/>
```

---

## FormControl / FormLabel / FormHelperText (Non-TextField)

Use these primitives for custom inputs like checkbox groups or radio groups where
`TextField` does not apply.

```tsx
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';

function NotificationPreferences() {
  const [prefs, setPrefs] = React.useState({ email: true, sms: false, push: true });
  const [error, setError] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...prefs, [e.target.name]: e.target.checked };
    setPrefs(updated);
    setError(!Object.values(updated).some(Boolean)); // at least one required
  };

  return (
    <FormControl error={error} component="fieldset" variant="standard">
      <FormLabel component="legend">Notification channels</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={prefs.email} onChange={handleChange} name="email" />}
          label="Email notifications"
        />
        <FormControlLabel
          control={<Checkbox checked={prefs.sms} onChange={handleChange} name="sms" />}
          label="SMS notifications"
        />
        <FormControlLabel
          control={<Checkbox checked={prefs.push} onChange={handleChange} name="push" />}
          label="Push notifications"
        />
      </FormGroup>
      {error && <FormHelperText>Select at least one notification channel.</FormHelperText>}
    </FormControl>
  );
}
```

---

## React Hook Form + MUI

React Hook Form is the recommended library for complex forms. Use the `Controller`
component to integrate with MUI controlled inputs. Avoid spreading `register()` directly
on MUI inputs — use `Controller` instead.

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'editor', 'viewer'], { required_error: 'Select a role' }),
  notifications: z.boolean(),
  tags: z.array(z.string()).min(1, 'Select at least one tag'),
});

type FormValues = z.infer<typeof schema>;

function UserForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      email: '',
      notifications: false,
      tags: [],
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {/* Text field */}
        <Controller
          name="firstName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="First name"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              fullWidth
            />
          )}
        />

        {/* Email field */}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />
          )}
        />

        {/* Select */}
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <FormControl error={!!errors.role} fullWidth>
              <InputLabel>Role</InputLabel>
              <Select {...field} label="Role">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
              {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
            </FormControl>
          )}
        />

        {/* Autocomplete (multi) */}
        <Controller
          name="tags"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Autocomplete
              multiple
              options={availableTags}
              value={value}
              onChange={(_, newValue) => onChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  error={!!errors.tags}
                  helperText={errors.tags?.message}
                />
              )}
            />
          )}
        />

        {/* Checkbox */}
        <Controller
          name="notifications"
          control={control}
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={
                <Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />
              }
              label="Receive email notifications"
            />
          )}
        />

        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          fullWidth
        >
          Save
        </LoadingButton>
      </Stack>
    </Box>
  );
}
```

### useFieldArray for dynamic lists

```tsx
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({ control, name: 'items' });

{fields.map((field, index) => (
  <Stack key={field.id} direction="row" spacing={1}>
    <Controller
      name={`items.${index}.value`}
      control={control}
      render={({ field: f }) => <TextField {...f} label={`Item ${index + 1}`} />}
    />
    <IconButton onClick={() => remove(index)}><DeleteIcon /></IconButton>
  </Stack>
))}
<Button onClick={() => append({ value: '' })} startIcon={<AddIcon />}>Add item</Button>
```

---

## Formik + MUI Integration

```tsx
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  age: Yup.number().min(18, 'Must be 18 or older').required('Age is required'),
});

function FormikForm() {
  return (
    <Formik
      initialValues={{ name: '', email: '', age: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        await submitData(values);
        setSubmitting(false);
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form>
          <Stack spacing={2}>
            <TextField
              name="name"
              label="Full name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              fullWidth
            />
            <TextField
              name="age"
              label="Age"
              type="number"
              value={values.age}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.age && Boolean(errors.age)}
              helperText={touched.age && errors.age}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
```

---

## Multi-Step Form with Stepper

```tsx
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

const STEPS = ['Personal info', 'Address', 'Review'];

function MultiStepForm() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    personal: { name: '', email: '' },
    address: { street: '', city: '', zip: '' },
  });

  const handleNext = (stepData: object) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <PersonalInfoStep data={formData.personal} onNext={handleNext} />
      )}
      {activeStep === 1 && (
        <AddressStep data={formData.address} onNext={handleNext} onBack={handleBack} />
      )}
      {activeStep === 2 && (
        <ReviewStep data={formData} onBack={handleBack} onSubmit={handleFinalSubmit} />
      )}

      {activeStep === STEPS.length && (
        <Box textAlign="center">
          <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h5">All done!</Typography>
        </Box>
      )}
    </Box>
  );
}
```

---

## Form Accessibility

```tsx
// Always use htmlFor on labels or the label prop on TextField
<FormControl>
  <FormLabel htmlFor="bio-input">Bio</FormLabel>
  <OutlinedInput id="bio-input" multiline rows={3} aria-describedby="bio-helper" />
  <FormHelperText id="bio-helper">Maximum 200 characters</FormHelperText>
</FormControl>

// Group related fields with fieldset + legend
<FormControl component="fieldset">
  <FormLabel component="legend">Delivery preference</FormLabel>
  <RadioGroup>
    <FormControlLabel value="standard" control={<Radio />} label="Standard (5-7 days)" />
    <FormControlLabel value="express" control={<Radio />} label="Express (2-3 days)" />
  </RadioGroup>
</FormControl>

// Announce validation errors to screen readers
<TextField
  inputProps={{
    'aria-describedby': emailError ? 'email-error' : undefined,
    'aria-invalid': !!emailError,
  }}
  error={!!emailError}
/>
{emailError && (
  <FormHelperText id="email-error" error role="alert">
    {emailError}
  </FormHelperText>
)}

// Use noValidate on form to suppress browser native validation bubbles
<Box component="form" noValidate onSubmit={handleSubmit}>
```

---

## React Hook Form + Zod (Modern Stack)

The recommended modern approach: type-safe, minimal re-renders.

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Complete Form with Zod Schema

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer'], {
    required_error: 'Please select a role',
  }),
  age: z.coerce.number().min(18, 'Must be 18+').max(120),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm({ onSubmit }: { onSubmit: (data: UserFormData) => void }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: undefined, bio: '' },
  });

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2} noValidate>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Full Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            required
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            required
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.role}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select {...field} labelId="role-label" label="Role">
              <MenuItem value="admin">Administrator</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="age"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Age"
            type="number"
            error={!!errors.age}
            helperText={errors.age?.message}
          />
        )}
      />

      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </Stack>
  );
}
```

### Controller Pattern for MUI Components

`Controller` is needed for MUI components because they don't use native HTML inputs:

```tsx
// DatePicker with Controller
<Controller
  name="startDate"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <DatePicker
      {...field}
      label="Start Date"
      slotProps={{
        textField: {
          error: !!error,
          helperText: error?.message,
        },
      }}
    />
  )}
/>

// Autocomplete with Controller
<Controller
  name="tags"
  control={control}
  render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
    <Autocomplete
      {...field}
      multiple
      options={allTags}
      value={value || []}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tags"
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  )}
/>

// Switch with Controller
<Controller
  name="notifications"
  control={control}
  render={({ field }) => (
    <FormControlLabel
      control={<Switch {...field} checked={field.value} />}
      label="Enable notifications"
    />
  )}
/>
```

### Multi-Step Form with Stepper

```tsx
const stepSchemas = [
  z.object({ name: z.string().min(1), email: z.string().email() }),
  z.object({ address: z.string().min(1), city: z.string().min(1) }),
  z.object({ cardNumber: z.string().regex(/^\d{16}$/) }),
];

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const currentSchema = stepSchemas[step];
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: formData,
  });

  const onStepSubmit = (data: any) => {
    const merged = { ...formData, ...data };
    setFormData(merged);
    if (step < stepSchemas.length - 1) {
      setStep(step + 1);
    } else {
      submitFinalForm(merged);
    }
  };

  return (
    <>
      <Stepper activeStep={step} alternativeLabel>
        <Step><StepLabel>Account</StepLabel></Step>
        <Step><StepLabel>Address</StepLabel></Step>
        <Step><StepLabel>Payment</StepLabel></Step>
      </Stepper>
      <Box component="form" onSubmit={handleSubmit(onStepSubmit)} sx={{ mt: 3 }}>
        {step === 0 && <AccountFields control={control} errors={errors} />}
        {step === 1 && <AddressFields control={control} errors={errors} />}
        {step === 2 && <PaymentFields control={control} errors={errors} />}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
          <Button type="submit" variant="contained">
            {step === stepSchemas.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
```

### Conditional Validation

```tsx
const schema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('personal'),
    name: z.string().min(1),
  }),
  z.object({
    accountType: z.literal('business'),
    name: z.string().min(1),
    companyName: z.string().min(1),
    taxId: z.string().regex(/^\d{9}$/, 'Tax ID must be 9 digits'),
  }),
]);
```

### Server-Side Validation Errors

```tsx
const { setError, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  try {
    await api.createUser(data);
  } catch (err) {
    if (err.response?.status === 422) {
      // Map server errors to form fields
      const serverErrors = err.response.data.errors;
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field as keyof FormData, { message: message as string });
      });
    }
  }
};
```
