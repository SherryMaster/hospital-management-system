/**
 * FormField Component
 * 
 * Reusable form field component with validation and error handling
 */

import React from 'react';
import {
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Autocomplete,
  Chip,
  Box,
} from '@mui/material';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';

const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  options = [],
  multiple = false,
  placeholder,
  rows,
  multiline = false,
  variant = 'outlined',
  size = 'medium',
  sx = {},
  ...props
}) => {
  const handleChange = (event, newValue) => {
    if (type === 'autocomplete') {
      onChange({ target: { name, value: newValue } });
    } else if (type === 'checkbox' || type === 'switch') {
      onChange({ target: { name, value: event.target.checked } });
    } else if (type === 'date' || type === 'time' || type === 'datetime') {
      onChange({ target: { name, value: newValue } });
    } else {
      onChange(event);
    }
  };

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled}>
            {label && <FormLabel required={required}>{label}</FormLabel>}
            <Select
              name={name}
              value={value || ''}
              onChange={handleChange}
              onBlur={onBlur}
              variant={variant}
              size={size}
              multiple={multiple}
              renderValue={multiple ? (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => (
                    <Chip key={val} label={val} size="small" />
                  ))}
                </Box>
              ) : undefined}
              {...props}
            >
              {options.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || helperText) && (
              <FormHelperText>{error || helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={!!error} disabled={disabled}>
            {label && <FormLabel component="legend" required={required}>{label}</FormLabel>}
            <RadioGroup
              name={name}
              value={value || ''}
              onChange={handleChange}
              onBlur={onBlur}
              {...props}
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={option.disabled}
                />
              ))}
            </RadioGroup>
            {(error || helperText) && (
              <FormHelperText>{error || helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                name={name}
                checked={!!value}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                {...props}
              />
            }
            label={label}
            sx={sx}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                name={name}
                checked={!!value}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                {...props}
              />
            }
            label={label}
            sx={sx}
          />
        );

      case 'autocomplete':
        return (
          <Autocomplete
            options={options}
            value={value || (multiple ? [] : null)}
            onChange={handleChange}
            onBlur={onBlur}
            multiple={multiple}
            disabled={disabled}
            getOptionLabel={(option) => option.label || option}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderInput={(params) => (
              <TextField
                {...params}
                name={name}
                label={label}
                required={required}
                error={!!error}
                helperText={error || helperText}
                variant={variant}
                size={size}
                placeholder={placeholder}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label || option}
                  {...getTagProps({ index })}
                  key={option.value || option}
                />
              ))
            }
            sx={sx}
            {...props}
          />
        );

      case 'date':
        return (
          <DatePicker
            label={label}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            slotProps={{
              textField: {
                name,
                required,
                error: !!error,
                helperText: error || helperText,
                fullWidth,
                variant,
                size,
                onBlur,
              },
            }}
            sx={sx}
            {...props}
          />
        );

      case 'time':
        return (
          <TimePicker
            label={label}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            slotProps={{
              textField: {
                name,
                required,
                error: !!error,
                helperText: error || helperText,
                fullWidth,
                variant,
                size,
                onBlur,
              },
            }}
            sx={sx}
            {...props}
          />
        );

      case 'datetime':
        return (
          <DateTimePicker
            label={label}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            slotProps={{
              textField: {
                name,
                required,
                error: !!error,
                helperText: error || helperText,
                fullWidth,
                variant,
                size,
                onBlur,
              },
            }}
            sx={sx}
            {...props}
          />
        );

      default:
        return (
          <TextField
            type={type}
            name={name}
            label={label}
            value={value || ''}
            onChange={handleChange}
            onBlur={onBlur}
            error={!!error}
            helperText={error || helperText}
            required={required}
            disabled={disabled}
            fullWidth={fullWidth}
            variant={variant}
            size={size}
            placeholder={placeholder}
            multiline={multiline}
            rows={rows}
            sx={sx}
            {...props}
          />
        );
    }
  };

  return renderField();
};

export default FormField;
