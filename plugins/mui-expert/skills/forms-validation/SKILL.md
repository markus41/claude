---
name: mui-forms-validation
description: MUI forms and validation — controlled patterns, React Hook Form, Formik, Zod/Yup, FormControl, multi-step forms, file upload, and accessibility
triggers:
  - form
  - validation
  - TextField
  - FormControl
  - react-hook-form
  - formik
  - input
  - select
  - submit
  - Zod
  - Yup
  - schema validation
  - Stepper
  - multi-step form
  - file upload
  - form accessibility
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

# MUI Forms & Validation Skill

## Controlled vs Uncontrolled

### Controlled (recommended)

```tsx
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function ControlledForm() {
  const [values, setValues] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!values.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) newErrors.email = 'Invalid email';
    if (!values.password) newErrors.password = 'Password is required';
    else if (values.password.length < 8) newErrors.password = 'Min 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // submit
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        error={!!errors.password}
        helperText={errors.password}
        margin="normal"
        required
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Sign In
      </Button>
    </Box>
  );
}
```

### Uncontrolled (with refs)

```tsx
import { useRef } from 'react';

function UncontrolledForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value;
    const name = nameRef.current?.value;
    console.log({ email, name });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField inputRef={emailRef} label="Email" defaultValue="" />
      <TextField inputRef={nameRef} label="Name" defaultValue="" />
      <Button type="submit">Submit</Button>
    </Box>
  );
}
```

---

## TextField Validation Patterns

```tsx
// Error + helperText pattern
<TextField
  label="Username"
  error={!!error}
  helperText={error || 'Letters and numbers only, 3–20 characters'}
  inputProps={{
    minLength: 3,
    maxLength: 20,
    pattern: '[A-Za-z0-9]+',
  }}
/>

// Real-time validation feedback
function EmailField() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const error = touched && !value
    ? 'Required'
    : touched && !/\S+@\S+\.\S+/.test(value)
      ? 'Invalid email address'
      : '';

  return (
    <TextField
      label="Email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => setTouched(true)}
      error={!!error}
      helperText={error || ' '}  // ' ' keeps height stable
      InputProps={{
        endAdornment: touched && !error && value
          ? <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          : undefined,
      }}
    />
  );
}
```

---

## FormControl Building Blocks

Use raw `FormControl` when you need custom layout or controls that `TextField` does not expose.

```tsx
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';

// FormGroup for checkboxes
<FormControl component="fieldset" error={!!errors.interests} required>
  <FormLabel component="legend">Interests</FormLabel>
  <FormGroup row>
    {['React', 'TypeScript', 'Node.js', 'Python'].map((item) => (
      <FormControlLabel
        key={item}
        control={
          <Checkbox
            checked={interests.includes(item)}
            onChange={handleInterestChange(item)}
          />
        }
        label={item}
      />
    ))}
  </FormGroup>
  <FormHelperText>{errors.interests || 'Select at least one'}</FormHelperText>
</FormControl>

// Custom input with FormControl
<FormControl fullWidth error={!!errors.amount}>
  <InputLabel htmlFor="amount-input">Amount</InputLabel>
  <OutlinedInput
    id="amount-input"
    label="Amount"
    type="number"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    startAdornment={<InputAdornment position="start">$</InputAdornment>}
    endAdornment={<InputAdornment position="end">USD</InputAdornment>}
  />
  <FormHelperText>{errors.amount}</FormHelperText>
</FormControl>
```

---

## React Hook Form + MUI

React Hook Form is the recommended validation library for MUI. Use `Controller` to bridge RHF's register model with controlled MUI components.

### Setup with Zod

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName:  z.string().min(1, 'Last name is required').max(50),
  email:     z.string().email('Invalid email address'),
  age:       z.number({ invalid_type_error: 'Age must be a number' }).min(18, 'Must be 18+').max(120),
  role:      z.enum(['admin', 'editor', 'viewer'], { errorMap: () => ({ message: 'Select a role' }) }),
  bio:       z.string().max(500).optional(),
  terms:     z.boolean().refine((v) => v, 'You must accept the terms'),
});

type FormData = z.infer<typeof schema>;

// 2. Form component
function ProfileForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'viewer',
      terms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    await api.saveProfile(data);
    reset();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Text input */}
      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="First Name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            margin="normal"
          />
        )}
      />

      {/* Number input */}
      <Controller
        name="age"
        control={control}
        render={({ field: { onChange, ...field } }) => (
          <TextField
            {...field}
            fullWidth
            label="Age"
            type="number"
            onChange={(e) => onChange(e.target.valueAsNumber)}
            error={!!errors.age}
            helperText={errors.age?.message}
            margin="normal"
          />
        )}
      />

      {/* Select */}
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.role}>
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

      {/* Checkbox */}
      <Controller
        name="terms"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <FormControl error={!!errors.terms}>
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                />
              }
              label="I accept the terms and conditions"
            />
            {errors.terms && <FormHelperText>{errors.terms.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isSubmitting || !isDirty}
        sx={{ mt: 3 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Save Profile'}
      </Button>
    </Box>
  );
}
```

### Autocomplete with RHF

```tsx
<Controller
  name="country"
  control={control}
  render={({ field: { onChange, value } }) => (
    <Autocomplete
      options={countries}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.code === val.code}
      value={value ?? null}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Country"
          error={!!errors.country}
          helperText={errors.country?.message}
        />
      )}
    />
  )}
/>
```

### DatePicker with RHF

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

<LocalizationProvider dateAdapter={AdapterDateFns}>
  <Controller
    name="birthDate"
    control={control}
    render={({ field }) => (
      <DatePicker
        {...field}
        label="Date of Birth"
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!errors.birthDate,
            helperText: errors.birthDate?.message,
          },
        }}
      />
    )}
  />
</LocalizationProvider>
```

---

## Formik + MUI

```bash
pnpm add formik yup
```

```tsx
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  email:    Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
  role:     Yup.string().oneOf(['admin', 'user']).required('Required'),
  agree:    Yup.boolean().oneOf([true], 'Must accept terms'),
});

function SignUpForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '', role: 'user', agree: false }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, setFieldError }) => {
        try {
          await api.register(values);
        } catch (err) {
          setFieldError('email', 'Email already taken');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form noValidate>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            margin="normal"
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && !!errors.password}
            helperText={touched.password && errors.password}
            margin="normal"
          />

          <FormControl fullWidth margin="normal" error={touched.role && !!errors.role}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={values.role}
              label="Role"
              onChange={handleChange}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {touched.role && errors.role && (
              <FormHelperText>{errors.role}</FormHelperText>
            )}
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                id="agree"
                name="agree"
                checked={values.agree}
                onChange={handleChange}
              />
            }
            label="I agree to the Terms of Service"
          />
          {touched.agree && errors.agree && (
            <FormHelperText error>{errors.agree}</FormHelperText>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
```

---

## File Upload

```tsx
import { useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

// Visually hidden input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// File upload button
<Button
  component="label"
  variant="contained"
  startIcon={<CloudUploadIcon />}
>
  Upload File
  <VisuallyHiddenInput
    type="file"
    accept="image/*,.pdf"
    multiple
    onChange={handleFileChange}
  />
</Button>

// Drag-and-drop zone
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s',
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="h6">Drop files here or click to browse</Typography>
      <Typography variant="body2" color="text.secondary">
        Supports: JPG, PNG, PDF up to 10MB
      </Typography>
      <VisuallyHiddenInput
        id="file-input"
        type="file"
        multiple
        onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
      />
    </Box>
  );
}
```

---

## Multi-Step Form with Stepper

```tsx
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';

const steps = ['Account Info', 'Personal Details', 'Preferences', 'Review'];

function MultiStepForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '', password: '',          // step 0
    firstName: '', lastName: '',       // step 1
    newsletter: false, theme: 'light', // step 2
  });

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  const updateData = (updates: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  const handleSubmit = async () => {
    await api.register(formData);
    handleNext(); // move to success step
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      {activeStep === 0 && (
        <AccountStep
          data={formData}
          onChange={updateData}
          onNext={handleNext}
        />
      )}
      {activeStep === 1 && (
        <PersonalStep
          data={formData}
          onChange={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {activeStep === 2 && (
        <PreferencesStep
          data={formData}
          onChange={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {activeStep === 3 && (
        <ReviewStep
          data={formData}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}
      {activeStep === steps.length && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5">Registration Complete!</Typography>
        </Box>
      )}
    </Box>
  );
}

// Per-step navigation buttons (reusable)
function StepNav({
  onBack,
  onNext,
  isFirst,
  isLast,
  isSubmitting,
  nextLabel = 'Next',
}: {
  onBack: () => void;
  onNext: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
      {!isFirst && (
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? <CircularProgress size={20} /> : isLast ? 'Submit' : nextLabel}
      </Button>
    </Box>
  );
}
```

---

## Select, Autocomplete, DatePicker in Forms

### Select in a form

```tsx
// With react-hook-form
<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <FormControl fullWidth error={!!errors.category}>
      <InputLabel>Category</InputLabel>
      <Select {...field} label="Category">
        {categories.map((cat) => (
          <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
        ))}
      </Select>
      <FormHelperText>{errors.category?.message}</FormHelperText>
    </FormControl>
  )}
/>
```

### DatePicker with validation

```tsx
import { z } from 'zod';

const schema = z.object({
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// In form
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <Controller
    name="startDate"
    control={control}
    render={({ field }) => (
      <DatePicker
        {...field}
        label="Start Date"
        disablePast
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!errors.startDate,
            helperText: errors.startDate?.message,
          },
        }}
      />
    )}
  />
</LocalizationProvider>
```

---

## Form Accessibility

```tsx
// Rule 1: Every field must have a visible label
// Use label prop or InputLabel, never placeholder-only

// Rule 2: Associate errors with the input
// MUI's error + helperText handles this automatically via aria-describedby
<TextField
  id="email"
  label="Email"
  error
  helperText="Invalid email"
  // aria-describedby is set automatically when helperText + id are present
/>

// Rule 3: Group related fields with fieldset + legend
<FormControl component="fieldset">
  <FormLabel component="legend">Notification preferences</FormLabel>
  <FormGroup>
    <FormControlLabel control={<Checkbox />} label="Email" />
    <FormControlLabel control={<Checkbox />} label="SMS" />
    <FormControlLabel control={<Checkbox />} label="Push" />
  </FormGroup>
</FormControl>

// Rule 4: Mark required fields
<TextField label="Email" required />  {/* adds asterisk and aria-required */}

// Rule 5: Announce validation errors dynamically
<Box role="alert" aria-live="polite" aria-atomic="true">
  {Object.values(errors).some(Boolean) && (
    <Alert severity="error" sx={{ mb: 2 }}>
      Please fix {Object.values(errors).filter(Boolean).length} error(s) before submitting.
    </Alert>
  )}
</Box>

// Rule 6: Loading state must be communicated
<Button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
>
  {isSubmitting ? (
    <>
      <CircularProgress size={18} sx={{ mr: 1 }} aria-hidden="true" />
      <span>Saving…</span>
    </>
  ) : (
    'Save'
  )}
</Button>

// Rule 7: Focus management in multi-step forms
const stepRefs = [useRef<HTMLDivElement>(), useRef<HTMLDivElement>(), useRef<HTMLDivElement>()];
useEffect(() => {
  stepRefs[activeStep]?.current?.focus();
}, [activeStep]);

// Wrap each step content
<Box ref={stepRefs[0]} tabIndex={-1} sx={{ outline: 'none' }}>
  <Step0Fields />
</Box>
```

---

## Form Performance Tips

```tsx
// 1. Use React Hook Form — minimal re-renders (register pattern avoids controlled inputs)
// Use Controller only for components that require controlled behavior (MUI)

// 2. Separate validation schema from component — import from a shared file
// src/validation/profile.ts
export const profileSchema = z.object({ ... });

// 3. Avoid inline schema definitions — they recreate the schema on every render
// BAD:
const Form = () => {
  const schema = z.object({ name: z.string() }); // new schema every render
  const { control } = useForm({ resolver: zodResolver(schema) });
};

// GOOD:
const schema = z.object({ name: z.string() }); // defined once at module level
const Form = () => {
  const { control } = useForm({ resolver: zodResolver(schema) });
};

// 4. Debounce async validation
import { useDebouncedCallback } from 'use-debounce';
const checkEmail = useDebouncedCallback(async (email: string) => {
  const taken = await api.checkEmail(email);
  if (taken) setError('email', { message: 'Email already taken' });
}, 500);

// 5. Use shouldFocusError to auto-focus first error
const { handleSubmit } = useForm({
  shouldFocusError: true,  // default true — focuses first field with error on submit
});
```

---

## Complete Login Form Example

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError('');
      await authApi.login(data);
    } catch (err) {
      setServerError('Invalid email or password');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        Sign in
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {serverError}
        </Alert>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Email address"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            margin="normal"
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            margin="normal"
          />
        )}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Controller
          name="remember"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={value} onChange={(e) => onChange(e.target.checked)} />}
              label="Remember me"
            />
          )}
        />
        <Link href="/forgot-password" variant="body2">Forgot password?</Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isSubmitting}
        sx={{ mt: 2 }}
      >
        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
      </Button>
    </Box>
  );
}
```
