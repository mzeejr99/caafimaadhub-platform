import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Lock, MapPin, Calendar, BookOpen, Globe,
  Heart, Shield, AlertCircle, CheckCircle2, Eye, EyeOff, Upload,
  Copy, Check, FileText, Hash, Building2, Sparkles, X, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Universal Dynamic Form Builder supporting both Light & Dark themes
 * Supports 3 Modes: 'create', 'edit', 'view'
 * In create mode, form fields start clean and empty
 */
export default function DynamicFormBuilder({
  schema = { sections: [] },
  initialValues = {},
  mode = 'create', // 'create' | 'edit' | 'view'
  onSubmit,
  onCancel,
  loading = false,
  error = '',
  submitLabel,
  cancelLabel,
  customActions,
  className = ''
}) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState(() => {
    const initial = {};
    if (schema.sections) {
      schema.sections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            if (initialValues[field.name] !== undefined) {
              initial[field.name] = initialValues[field.name];
            } else if (mode !== 'create' && field.defaultValue !== undefined) {
              initial[field.name] = field.defaultValue;
            } else if (field.type === 'checkbox-group') {
              initial[field.name] = [];
            } else {
              initial[field.name] = '';
            }
          });
        }
      });
    }
    return { ...initial, ...initialValues };
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Key tracking to only re-initialize when switching between create/edit or changing target record
  const recordKey = `${mode}-${initialValues?.id || 'new'}-${initialValues?.updated_at || ''}`;
  const [lastRecordKey, setLastRecordKey] = useState(recordKey);

  useEffect(() => {
    if (recordKey !== lastRecordKey) {
      setLastRecordKey(recordKey);
      const initial = {};
      if (schema.sections) {
        schema.sections.forEach(section => {
          if (section.fields) {
            section.fields.forEach(field => {
              if (initialValues[field.name] !== undefined) {
                initial[field.name] = initialValues[field.name];
              } else if (mode !== 'create' && field.defaultValue !== undefined) {
                initial[field.name] = field.defaultValue;
              } else if (field.type === 'checkbox-group') {
                initial[field.name] = [];
              } else {
                initial[field.name] = '';
              }
            });
          }
        });
      }
      setFormData({ ...initial, ...initialValues });
      setErrors({});
      setTouched({});
    }
  }, [recordKey, lastRecordKey, initialValues, schema, mode]);

  const validateField = (field, value) => {
    if (!field) return '';
    const val = value !== undefined && value !== null ? String(value).trim() : '';

    if (field.required && !val && field.type !== 'checkbox-group') {
      return language === 'so'
        ? `${field.label || 'Meeshan'} waa qasab (fadlan buuxi)`
        : `${field.label || 'This field'} is required`;
    }

    if (field.type === 'checkbox-group' && field.required) {
      if (!Array.isArray(value) || value.length === 0) {
        return language === 'so'
          ? 'Fadlan dooro ugu yaraan hal doorasho'
          : 'Please select at least one option';
      }
    }

    if (val && field.type === 'email') {
      const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(val)) {
        return language === 'so'
          ? 'Fadlan geli email sax ah (tusaale: user@example.com)'
          : 'Please enter a valid email address';
      }
    }

    if (val && (field.type === 'tel' || field.validation === 'phone')) {
      const digits = val.replace(/[^0-9]/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return language === 'so'
          ? 'Lambarka telefoonku waa inuu u dhexeeyaa 7 ilaa 15 lambar'
          : 'Phone number must be between 7 and 15 digits';
      }
    }

    if (val && field.type === 'password' && mode === 'create') {
      if (val.length < 6) {
        return language === 'so'
          ? 'Password-ku waa inuu ugu yaraan ka koobnaadaa 6 xaraf'
          : 'Password must be at least 6 characters';
      }
    }

    if (field.customValidator) {
      const customErr = field.customValidator(value, formData, language);
      if (customErr) return customErr;
    }

    return '';
  };

  const handleFieldChange = (name, value, fieldConfig) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(fieldConfig, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));
    const err = validateField(field, formData[field.name]);
    setErrors(prev => ({ ...prev, [field.name]: err }));
  };

  const handleCheckboxGroupToggle = (fieldName, optionValue, fieldConfig) => {
    const current = Array.isArray(formData[fieldName]) ? [...formData[fieldName]] : [];
    const index = current.indexOf(optionValue);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optionValue);
    }
    handleFieldChange(fieldName, current, fieldConfig);
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (mode === 'view') return;

    // Validate all fields
    const newErrors = {};
    const newTouched = {};
    let hasError = false;

    if (schema.sections) {
      schema.sections.forEach(sec => {
        if (sec.fields) {
          sec.fields.forEach(f => {
            newTouched[f.name] = true;
            if (f.type === 'password' && mode === 'edit' && !formData[f.name]) {
              return;
            }
            if (f.condition && !f.condition(formData)) {
              return;
            }
            const err = validateField(f, formData[f.name]);
            if (err) {
              newErrors[f.name] = err;
              hasError = true;
            }
          });
        }
      });
    }

    setTouched(newTouched);
    setErrors(newErrors);

    if (hasError) return;
    if (onSubmit) onSubmit(formData);
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'user': return <User className="w-5 h-5" />;
      case 'mail': return <Mail className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'lock': return <Lock className="w-5 h-5" />;
      case 'map-pin': return <MapPin className="w-5 h-5" />;
      case 'calendar': return <Calendar className="w-5 h-5" />;
      case 'book': return <BookOpen className="w-5 h-5" />;
      case 'globe': return <Globe className="w-5 h-5" />;
      case 'heart': return <Heart className="w-5 h-5" />;
      case 'shield': return <Shield className="w-5 h-5" />;
      case 'building': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // Render Field in VIEW Mode
  const renderViewField = (field) => {
    const rawVal = formData[field.name];
    let displayVal = rawVal;

    if (field.type === 'select' && field.options) {
      const found = field.options.find(o => (typeof o === 'object' ? o.value : o) === rawVal);
      if (found) displayVal = typeof found === 'object' ? found.label : found;
    } else if (field.type === 'checkbox-group' || Array.isArray(rawVal)) {
      displayVal = Array.isArray(rawVal) && rawVal.length > 0 ? rawVal.join(', ') : '—';
    } else if (field.type === 'password') {
      displayVal = '••••••••••••';
    }

    if (!displayVal && displayVal !== 0) displayVal = '—';

    return (
      <div key={field.name} className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
            {field.icon && <span className="text-teal-600 dark:text-teal-400">{renderIcon(field.icon)}</span>}
            {field.label}
          </span>
          {rawVal && field.type !== 'password' && (
            <button
              type="button"
              onClick={() => copyToClipboard(rawVal, field.name)}
              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 rounded transition-colors"
              title="Copy value"
            >
              {copiedField === field.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">
          {displayVal}
        </p>
      </div>
    );
  };

  // Render Field in EDIT / CREATE Mode
  const renderEditableField = (field) => {
    if (field.condition && !field.condition(formData)) {
      return null;
    }

    const fieldError = touched[field.name] ? errors[field.name] : '';
    const isFieldTouched = touched[field.name];
    const val = formData[field.name] !== undefined && formData[field.name] !== null ? formData[field.name] : '';
    const hasValue = Array.isArray(val) ? val.length > 0 : String(val).trim() !== '';
    const isValid = isFieldTouched && !fieldError && hasValue;
    const isInvalid = !!fieldError;

    // Resolve dynamic options (e.g. cascading districts)
    const rawOptions = typeof field.options === 'function' ? field.options(formData) : (field.options || []);
    const optionsList = Array.isArray(rawOptions) ? rawOptions : [];

    // Is field currently focused
    const isFocused = touched[`${field.name}_focus`];
    const isFloated = field.type === 'select' || isFocused || hasValue || field.type === 'date';

    // Border and Glow Colors matching Google Outlined Field
    const borderClass = isInvalid
      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10'
      : isValid
      ? 'border-emerald-500/80 ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
      : isFocused
      ? 'border-teal-600 dark:border-teal-400 ring-2 ring-teal-500/20 bg-white dark:bg-slate-900'
      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600';

    const labelColor = isInvalid
      ? 'text-rose-500 font-bold'
      : isValid
      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
      : isFocused
      ? 'text-teal-600 dark:text-teal-400 font-bold'
      : 'text-slate-400 dark:text-slate-400 font-normal';

    const iconColor = isInvalid
      ? 'text-rose-500'
      : isValid
      ? 'text-emerald-500'
      : isFocused
      ? 'text-teal-600 dark:text-teal-400'
      : 'text-slate-400 dark:text-slate-500';

    const effectiveLabel = field.label || field.placeholder;
    const defaultSelectPlaceholder = field.placeholder || (language === 'so' ? '-- Dooro mid --' : '-- Select option --');

    return (
      <div key={field.name} className={`relative pt-1.5 ${field.colSpan ? `col-span-${field.colSpan}` : ''}`}>
        
        {field.type === 'select' ? (
          <div className={`relative flex items-center rounded-xl border transition-all duration-200 shadow-2xs ${borderClass}`}>
            
            {/* Floating Outline Label (Always notched on border for selects) */}
            {effectiveLabel && (
              <label
                htmlFor={field.name}
                className={`absolute -top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider pointer-events-none transition-all duration-150 select-none z-10 ${labelColor}`}
              >
                <span>{effectiveLabel}</span>
                {field.required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
              </label>
            )}

            {field.icon && (
              <div className={`pl-3 pr-1 flex items-center justify-center shrink-0 pointer-events-none transition-colors ${iconColor}`}>
                {renderIcon(field.icon)}
              </div>
            )}

            <select
              id={field.name}
              name={field.name}
              value={val}
              onChange={(e) => {
                const nextVal = e.target.value;
                handleFieldChange(field.name, nextVal, field);
                // If region changed, clear district if invalid
                if (field.name === 'region' && formData.district) {
                  handleFieldChange('district', '', { name: 'district' });
                }
              }}
              onFocus={() => setTouched(prev => ({ ...prev, [`${field.name}_focus`]: true }))}
              onBlur={() => {
                setTouched(prev => ({ ...prev, [`${field.name}_focus`]: false }));
                handleBlur(field);
              }}
              disabled={field.disabled || loading}
              className={`w-full py-3 ${field.icon ? 'pl-2' : 'pl-3.5'} pr-9 text-sm bg-transparent text-slate-900 dark:text-white appearance-none focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-400">
                {defaultSelectPlaceholder}
              </option>
              {optionsList.map((opt, i) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={i} value={optVal} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {optLabel}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        ) : field.type === 'textarea' ? (
          <div className={`relative rounded-xl border transition-all duration-200 shadow-2xs ${borderClass}`}>
            
            {/* Floating Outline Label */}
            {effectiveLabel && (
              <label
                htmlFor={field.name}
                className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
                  isFloated
                    ? `-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider ${labelColor}`
                    : `top-3.5 left-3.5 text-sm leading-normal ${labelColor}`
                }`}
              >
                <span>{effectiveLabel}</span>
                {field.required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
              </label>
            )}

            <textarea
              id={field.name}
              name={field.name}
              rows={field.rows || 3}
              value={val}
              placeholder={isFloated && field.placeholder !== effectiveLabel ? field.placeholder : ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
              onFocus={() => setTouched(prev => ({ ...prev, [`${field.name}_focus`]: true }))}
              onBlur={() => {
                setTouched(prev => ({ ...prev, [`${field.name}_focus`]: false }));
                handleBlur(field);
              }}
              disabled={field.disabled || loading}
              className="w-full p-3.5 pt-4 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-y min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ) : field.type === 'checkbox-group' ? (
          <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 space-y-2.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {field.label} {field.required && <span className="text-rose-500 font-bold">*</span>}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {optionsList.map((opt, i) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const isChecked = Array.isArray(val) && val.includes(optVal);
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-300 ring-1 ring-teal-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxGroupToggle(field.name, optVal, field)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{optLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`relative flex items-center rounded-xl border transition-all duration-200 shadow-2xs ${borderClass}`}>
            
            {/* Floating Outline Label */}
            {effectiveLabel && (
              <label
                htmlFor={field.name}
                className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
                  isFloated
                    ? `-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] leading-none tracking-wider ${labelColor}`
                    : `top-1/2 -translate-y-1/2 ${field.icon ? 'left-10' : 'left-3.5'} text-sm leading-normal ${labelColor}`
                }`}
              >
                <span>{effectiveLabel}</span>
                {field.required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
              </label>
            )}

            {field.icon && (
              <div className={`pl-3 pr-1 flex items-center justify-center shrink-0 pointer-events-none transition-colors ${iconColor}`}>
                {renderIcon(field.icon)}
              </div>
            )}

            <input
              id={field.name}
              name={field.name}
              type={field.type === 'password' ? (showPasswordMap[field.name] ? 'text' : 'password') : field.type || 'text'}
              value={val}
              onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
              onFocus={() => setTouched(prev => ({ ...prev, [`${field.name}_focus`]: true }))}
              onBlur={() => {
                setTouched(prev => ({ ...prev, [`${field.name}_focus`]: false }));
                handleBlur(field);
              }}
              disabled={field.disabled || loading}
              autoComplete={field.autoComplete || (field.type === 'password' ? 'new-password' : (mode === 'create' ? 'off' : undefined))}
              data-lpignore="true"
              data-1p-ignore="true"
              className={`w-full py-3 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                field.icon ? 'pl-2' : 'pl-3.5'
              } ${field.type === 'password' || isValid ? 'pr-10' : 'pr-3.5'}`}
            />

            {field.type === 'password' ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPasswordMap(p => ({ ...p, [field.name]: !p[field.name] }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title={showPasswordMap[field.name] ? 'Hide password' : 'Show password'}
              >
                {showPasswordMap[field.name] ? <EyeOff className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <Eye className="w-4 h-4" />}
              </button>
            ) : isValid ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : null}
          </div>
        )}

        {/* Error message */}
        {fieldError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1 px-1 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{fieldError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleFormSubmit} autoComplete="off" noValidate className={`space-y-6 ${className}`}>
      {/* Hidden dummy fields to prevent browser auto-injection */}
      {mode === 'create' && (
        <div style={{ display: 'none' }} aria-hidden="true">
          <input type="text" name="prevent_autofill_user" tabIndex={-1} autoComplete="off" />
          <input type="password" name="prevent_autofill_pwd" tabIndex={-1} autoComplete="new-password" />
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {schema.sections?.map((section, sIndex) => {
        if (section.condition && !section.condition(formData)) return null;

        return (
          <div
            key={sIndex}
            className="rounded-2xl bg-slate-50/70 dark:bg-[#1E293B]/70 border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 backdrop-blur-md"
          >
            {/* Section Header */}
            {(section.title || section.description) && (
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3.5 mb-2">
                <div className="flex items-center gap-2.5">
                  {section.icon && (
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                      {renderIcon(section.icon)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
                      {section.title}
                    </h4>
                    {section.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{section.description}</p>
                    )}
                  </div>
                </div>
                {section.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30">
                    {section.badge}
                  </span>
                )}
              </div>
            )}

            {/* Section Fields Grid */}
            <div className={`grid gap-4 ${section.gridCols || 'grid-cols-1 md:grid-cols-2'}`}>
              {section.fields?.map(field => {
                if (mode === 'view') {
                  if (field.condition && !field.condition(formData)) return null;
                  return renderViewField(field);
                }
                return renderEditableField(field);
              })}
            </div>
          </div>
        );
      })}

      {/* Form Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        {customActions}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#334155] dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:text-white transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel || (language === 'so' ? 'Ka noqo' : 'Cancel')}
          </button>
        )}

        {mode !== 'view' && (
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#0D9488] to-[#10B981] hover:from-teal-600 hover:to-emerald-500 text-white shadow-lg shadow-teal-700/20 dark:shadow-teal-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'so' ? 'Fadlan sug...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{submitLabel || (mode === 'create' ? (language === 'so' ? 'Diiwaangeli' : 'Create Record') : (language === 'so' ? 'Kaydi Isbeddelka' : 'Save Changes'))}</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
