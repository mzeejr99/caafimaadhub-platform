import React, { useState } from 'react';
import {
  Eye, EyeOff, CheckCircle2, AlertCircle,
  User, Mail, Phone, Lock, Search, Calendar, ChevronDown
} from 'lucide-react';
import {
  validateTextOnly,
  validateEmail,
  validateNumberOnly,
  validatePhone,
  validatePassword
} from '../../utils/validation';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Modern Google / Material Outlined Floating Input Component
 * Matches Image 3 (rest state: label inside) & Image 4 (active state: floating label on top notch)
 */
export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  validationType,
  showValidation = true,
  showPasswordRules = false,
  submitted = false,
  enableSpeech = false,
  autoComplete,
  ...props
}) {
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const valString = value !== undefined && value !== null ? String(value) : '';
  const isEmpty = valString.trim() === '';

  let isFieldValid = false;
  let validationMessage = '';
  let pwdState = null;

  if (isEmpty) {
    isFieldValid = !required && !validationType;
    validationMessage = language === 'so'
      ? `${label || 'Meeshan'} waa qasab (fadlan buuxi)`
      : `${label || 'This field'} is required`;
  } else {
    if (validationType === 'text-only') {
      const r = validateTextOnly(valString, label || 'Meeshan', language);
      isFieldValid = r.isValid;
      validationMessage = r.message;
    } else if (validationType === 'email' || type === 'email') {
      const r = validateEmail(valString, language);
      isFieldValid = r.isValid;
      validationMessage = r.message;
    } else if (validationType === 'number-only') {
      const r = validateNumberOnly(valString, label || 'Lambarka', language);
      isFieldValid = r.isValid;
      validationMessage = r.message;
    } else if (validationType === 'phone' || type === 'tel') {
      const r = validatePhone(valString, language);
      isFieldValid = r.isValid;
      validationMessage = r.message;
    } else if (validationType === 'password') {
      pwdState = validatePassword(valString, language);
      isFieldValid = pwdState.isValid;
      validationMessage = pwdState.message;
    } else {
      isFieldValid = true;
      validationMessage = '';
    }
  }

  const shouldShowError = !!error || ((touched || submitted) && !isFieldValid);
  const finalError = error || (shouldShowError ? validationMessage : '');
  const isValidState = showValidation && isFieldValid && !error && !isEmpty;
  const isInvalidState = showValidation && shouldShowError;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const isPasswordField = type === 'password' || validationType === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  const handleChange = (e) => {
    const v = e.target.value;
    if (validationType === 'text-only') {
      if (v === '' || /^[A-Za-z\s]*$/.test(v)) {
        if (onChange) onChange(e);
      }
    } else if (validationType === 'number-only' || type === 'number') {
      const digitsOnly = v.replace(/[^0-9]/g, '');
      e.target.value = digitsOnly;
      if (onChange) onChange(e);
    } else if (validationType === 'phone' || type === 'tel') {
      const phoneOnly = v.replace(/[^0-9+]/g, '');
      e.target.value = phoneOnly;
      if (onChange) onChange(e);
    } else {
      if (onChange) onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    if (validationType === 'number-only' || type === 'number') {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
      if (allowedKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    } else if (validationType === 'text-only') {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '];
      if (allowedKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (!/^[a-zA-Z\s]$/.test(e.key)) {
        e.preventDefault();
      }
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const LeftIcon = Icon || (
    type === 'email' || validationType === 'email' ? Mail :
    type === 'tel' || validationType === 'phone' ? Phone :
    isPasswordField ? Lock :
    type === 'search' ? Search :
    type === 'date' ? Calendar :
    null
  );

  // Floating condition: active if focused, has value, or is date input
  const isFloated = isFocused || !isEmpty || type === 'date';
  const effectiveLabel = label || placeholder;

  // Container border styling matching Google/Material Outlined Field
  const containerBorder = isInvalidState
    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10'
    : isValidState
    ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
    : isFocused
    ? 'border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20 bg-white dark:bg-slate-900'
    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600';

  const labelColor = isInvalidState
    ? 'text-rose-500 font-bold'
    : isValidState
    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : isFocused
    ? 'text-sky-600 dark:text-sky-400 font-bold'
    : 'text-slate-400 dark:text-slate-400 font-normal';

  const iconColor = isInvalidState
    ? 'text-rose-500'
    : isValidState
    ? 'text-emerald-500'
    : isFocused
    ? 'text-sky-600 dark:text-sky-400'
    : 'text-slate-400 dark:text-slate-500';

  return (
    <div className={`relative ${className}`}>
      {/* Outlined Container */}
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 shadow-2xs ${containerBorder}`}>
        
        {/* Floating Label / Outline Notch */}
        {effectiveLabel && (
          <label
            htmlFor={name}
            className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
              isFloated
                ? `-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider ${labelColor}`
                : `top-1/2 -translate-y-1/2 ${LeftIcon ? 'left-9' : 'left-3.5'} text-sm leading-normal ${labelColor}`
            }`}
          >
            <span>{effectiveLabel}</span>
            {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
          </label>
        )}

        {/* Left Icon */}
        {LeftIcon && (
          <div className={`pl-3 pr-1 flex items-center justify-center shrink-0 pointer-events-none transition-colors ${iconColor}`}>
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        {/* Real Input */}
        <input
          id={name}
          name={name}
          type={effectiveType}
          value={valString}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFloated && placeholder !== effectiveLabel ? placeholder : ''}
          disabled={disabled}
          autoComplete={autoComplete || (isPasswordField ? 'new-password' : type === 'email' ? 'off' : undefined)}
          className={`w-full py-3 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-2' : 'pl-3.5'
          } ${isPasswordField || isValidState || isInvalidState ? 'pr-10' : 'pr-3.5'}`}
          {...props}
        />

        {/* Password toggle / validation icons */}
        {isPasswordField ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4 text-sky-600 dark:text-sky-400" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : isValidState ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : isInvalidState ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-rose-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {finalError && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold px-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{finalError}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Modern Google / Material Outlined Floating Select Component
 */
export function Select({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  submitted = false,
  icon: Icon,
  ...props
}) {
  const { language } = useLanguage();
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const valString = value !== undefined && value !== null ? String(value) : '';
  const isEmpty = valString.trim() === '';
  const shouldShowError = !!error || ((touched || submitted) && required && isEmpty);
  const isValid = required && !isEmpty && !error;

  const handleBlur = (e) => {
    setIsFocused(false);
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  // Select dropdowns always keep the label floated on the top notch border to prevent collision with option/placeholder text
  const isFloated = true;
  const effectiveLabel = label || placeholder;

  const borderClass = shouldShowError
    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10'
    : isValid
    ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
    : isFocused
    ? 'border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20 bg-white dark:bg-slate-900'
    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600';

  const labelColor = shouldShowError
    ? 'text-rose-500 font-bold'
    : isValid
    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : isFocused
    ? 'text-sky-600 dark:text-sky-400 font-bold'
    : 'text-slate-400 dark:text-slate-400 font-normal';

  const defaultPlaceholder = language === 'so' ? '-- Dooro mid --' : '-- Select option --';

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 shadow-2xs ${borderClass}`}>
        
        {/* Floating Label (Top Notch Border) */}
        {effectiveLabel && (
          <label
            htmlFor={name}
            className={`absolute -top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider pointer-events-none transition-all duration-150 select-none z-10 ${labelColor}`}
          >
            <span>{effectiveLabel}</span>
            {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
          </label>
        )}

        {Icon && (
          <div className="pl-3 pr-1 flex items-center justify-center shrink-0 pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          id={name}
          name={name}
          value={valString}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full py-3 ${Icon ? 'pl-2' : 'pl-3.5'} pr-9 text-sm bg-transparent text-slate-900 dark:text-white appearance-none focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        >
          <option value="" className="bg-white dark:bg-slate-900 text-slate-400">
            {defaultPlaceholder}
          </option>
          {options.map((opt, i) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return <option key={i} value={val} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{lbl}</option>;
          })}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {shouldShowError && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold px-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{error || (language === 'so' ? 'Fadlan dooro mid ka mid ah doorashooyinka' : 'Please select an option')}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Modern Google / Material Outlined Floating Textarea Component
 */
export function Textarea({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  submitted = false,
  enableSpeech = false,
  ...props
}) {
  const { language } = useLanguage();
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const valString = value !== undefined && value !== null ? String(value) : '';
  const isEmpty = valString.trim() === '';
  const shouldShowError = !!error || ((touched || submitted) && required && isEmpty);
  const validationMsg = error || (language === 'so'
    ? `${label || 'Meeshan'} waa qasab (fadlan buuxi)`
    : `${label || 'This field'} is required`);
  const isValid = required && !shouldShowError && !isEmpty;

  const handleBlur = (e) => {
    setIsFocused(false);
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const isFloated = isFocused || !isEmpty;
  const effectiveLabel = label || placeholder;

  const borderClass = shouldShowError
    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10'
    : isValid
    ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
    : isFocused
    ? 'border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20 bg-white dark:bg-slate-900'
    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600';

  const labelColor = shouldShowError
    ? 'text-rose-500 font-bold'
    : isValid
    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : isFocused
    ? 'text-sky-600 dark:text-sky-400 font-bold'
    : 'text-slate-400 dark:text-slate-400 font-normal';

  return (
    <div className={`relative ${className}`}>
      <div className={`relative rounded-xl border transition-all duration-200 shadow-2xs ${borderClass}`}>
        
        {/* Floating Label */}
        {effectiveLabel && (
          <label
            htmlFor={name}
            className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
              isFloated
                ? `-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider ${labelColor}`
                : `top-3.5 left-3.5 text-sm leading-normal ${labelColor}`
            }`}
          >
            <span>{effectiveLabel}</span>
            {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
          </label>
        )}

        <textarea
          id={name}
          name={name}
          rows={rows}
          value={valString}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={isFloated && placeholder !== effectiveLabel ? placeholder : ''}
          disabled={disabled}
          className="w-full p-3.5 pt-4 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-y min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
      </div>

      {shouldShowError && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold px-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{validationMsg}</span>
        </div>
      )}
    </div>
  );
}

