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
  - input
  - submit
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

# MUI Forms & Validation

Use this skill when building forms with MUI, integrating with validation libraries, or handling form accessibility.

## Controlled TextField with validation

```tsx
import TextField from '@mui/material/TextField';

function EmailField() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
  };

  return (
    <TextField
      label="Email"
      type="email"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        setError(validate(e.target.value));
      }}
      error={!!error}
      helperText={error || 'Enter your work email'}
      required
      fullWidth
    />
  );
}
```

## React Hook Form + MUI

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

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'editor', 'viewer'], { required_error: 'Select a role' }),
});

type FormData = z.infer<typeof schema>;

function UserForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: undefined },
  });

  const onSubmit = (data: FormData) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            margin="normal"
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
            margin="normal"
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.role}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select {...field} labelId="role-label" label="Role">
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Submit
      </Button>
    </form>
  );
}
```

## FormControl pattern

```tsx
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';

<FormControl component="fieldset" error={!!errors.permissions} required>
  <FormLabel component="legend">Permissions</FormLabel>
  <FormGroup>
    <FormControlLabel control={<Checkbox checked={read} onChange={handleChange} name="read" />} label="Read" />
    <FormControlLabel control={<Checkbox checked={write} onChange={handleChange} name="write" />} label="Write" />
    <FormControlLabel control={<Checkbox checked={admin} onChange={handleChange} name="admin" />} label="Admin" />
  </FormGroup>
  <FormHelperText>{errors.permissions ?? 'Select at least one'}</FormHelperText>
</FormControl>
```

## Multi-step form with Stepper

```tsx
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

const steps = ['Account Info', 'Personal Details', 'Review'];

function MultiStepForm() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && <AccountInfoStep onNext={() => setActiveStep(1)} />}
      {activeStep === 1 && <PersonalDetailsStep onNext={() => setActiveStep(2)} onBack={() => setActiveStep(0)} />}
      {activeStep === 2 && <ReviewStep onBack={() => setActiveStep(1)} onSubmit={handleSubmit} />}
    </>
  );
}
```

## Form accessibility checklist

1. Every input has a visible `label` (not just `placeholder`)
2. Error messages linked via `aria-describedby` (MUI does this automatically with `helperText`)
3. Required fields marked with `required` prop (adds `aria-required`)
4. Error state uses `error` prop (adds `aria-invalid`)
5. Use `<form>` element with `noValidate` for custom validation
6. Group related fields with `FormControl component="fieldset"` + `FormLabel component="legend"`
7. Submit button uses `type="submit"`
