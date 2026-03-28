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
