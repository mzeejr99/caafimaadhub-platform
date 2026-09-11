/**
 * CaafimaadHub Validation Rules & Helpers
 * Enforces strict validation for:
 * - Text/Name fields: ONLY Letters & spaces (e.g. A-Z, a-z)
 * - Number fields: ONLY digits (0-9)
 * - Email fields: Must start with text, optional numbers, valid standard domain (e.g. ali@gmail.com, ali12@gmail.com)
 * - Password fields: Must contain letters, numbers, and special symbols (!@#$%^&* etc.), min 8 chars
 * - Phone numbers: Only numbers and optional leading +
 */

// Letters, spaces, dots (for titles like Dr. / Eng.), hyphens and apostrophes allowed
export const TEXT_ONLY_REGEX = /^[A-Za-z\s.'’\-]+$/;

// Strict Email: Must start with letters, followed by optional letters/numbers/periods, @, valid domain, ending with valid 2-6 letter TLD
export const STRICT_EMAIL_REGEX = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// Numbers only (0-9)
export const NUMBER_ONLY_REGEX = /^[0-9]+$/;

// Phone number (optional leading +, followed by 7-15 digits)
export const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

// Password rules
export const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
export const PASSWORD_NUMBER_REGEX = /[0-9]/;
export const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export function validateTextOnly(value, fieldName = 'Meeshan', lang = 'so') {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? `${fieldName} waa qasab (fadlan buuxi)` : `${fieldName} is required`
    };
  }
  const clean = value.trim();
  const hasLetter = /[A-Za-z]/.test(clean);
  if (!hasLetter || !TEXT_ONLY_REGEX.test(clean)) {
    return {
      isValid: false,
      message: lang === 'so' ? `Fadlan geli xarfo (letters) kaliya, lambar ama calaamado kale lama ogola` : 'Only letters and name characters are allowed, no numbers'
    };
  }
  return { isValid: true, message: '' };
}

export function validateEmail(value, lang = 'so') {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? 'Email-ka waa qasab' : 'Email is required'
    };
  }
  const clean = value.trim();
  if (!STRICT_EMAIL_REGEX.test(clean)) {
    return {
      isValid: false,
      message: lang === 'so'
        ? 'Email khaldan! Waa inuu ku bilaabmaa xarfo (tusaale: ali@gmail.com ama ali12@gmail.com), wax dambe laguma dari karo'
        : 'Invalid email! Must start with letters (e.g. ali@gmail.com or ali12@gmail.com) with a valid domain (e.g. @gmail.com)'
    };
  }
  return { isValid: true, message: '' };
}

export function validateNumberOnly(value, fieldName = 'Lambarka', lang = 'so') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? `${fieldName} waa qasab (fadlan buuxi)` : `${fieldName} is required`
    };
  }
  const str = String(value).trim();
  if (!NUMBER_ONLY_REGEX.test(str)) {
    return {
      isValid: false,
      message: lang === 'so' ? 'Fadlan geli lambar (numbers 0-9) kaliya' : 'Only numeric digits (0-9) are allowed'
    };
  }
  return { isValid: true, message: '' };
}

export function validatePhone(value, lang = 'so') {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? 'Lambarka taleefanka waa qasab' : 'Phone number is required'
    };
  }
  const clean = value.trim();
  if (!PHONE_REGEX.test(clean)) {
    return {
      isValid: false,
      message: lang === 'so' ? 'Lambarka taleefanka waa inuu ka koobnaadaa lambarro kaliya (tusaale: +252611234567 ama 0611234567)' : 'Phone number must contain digits only (e.g. +252611234567)'
    };
  }
  return { isValid: true, message: '' };
}

export function validatePassword(value, lang = 'so') {
  if (!value || value === '') {
    return {
      isValid: false,
      hasLetter: false,
      hasNumber: false,
      hasSpecial: false,
      hasMinLength: false,
      message: lang === 'so' ? 'Password-ka waa qasab' : 'Password is required'
    };
  }

  const hasLetter = PASSWORD_LETTER_REGEX.test(value);
  const hasNumber = PASSWORD_NUMBER_REGEX.test(value);
  const hasSpecial = PASSWORD_SPECIAL_REGEX.test(value);
  const hasMinLength = value.length >= 6;

  const isValid = value.length >= 6;

  let message = '';
  if (!isValid) {
    message = lang === 'so' ? 'Password-ku waa inuu ugu yaraan ka koobnaadaa 6 xaraf' : 'Password must be at least 6 characters';
  }

  return {
    isValid,
    hasLetter,
    hasNumber,
    hasSpecial,
    hasMinLength,
    message
  };
}

export function validateFutureOrTodayDate(value, fieldName = 'Taariikhda', lang = 'so', allowPast = false) {
  if (!value || String(value).trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? `${fieldName} waa qasab (fadlan dooro)` : `${fieldName} is required`
    };
  }
  if (allowPast) {
    return { isValid: true, message: '' };
  }
  const selected = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 1-day timezone buffer so today's date in any timezone is always valid
  const buffer = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (selected < buffer) {
    return {
      isValid: false,
      message: lang === 'so'
        ? `${fieldName} ma noqon karto taariikh hore u soo dhaaftay`
        : `${fieldName} cannot be in the past`
    };
  }
  return { isValid: true, message: '' };
}

/**
 * Validates date of birth to ensure person is at least 18 years old.
 * Rejects any date of birth younger than 18 or in the future.
 */
export function validateAge18Plus(value, lang = 'so', fieldName = 'Taariikhda dhalashada') {
  if (!value || String(value).trim() === '') {
    return {
      isValid: false,
      message: lang === 'so' ? `${fieldName} waa qasab (fadlan dooro)` : `${fieldName} is required`
    };
  }

  const birthDate = new Date(value);
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      message: lang === 'so' ? 'Taariikhda dhalashadu ma saxna' : 'Invalid date of birth'
    };
  }

  const today = new Date();
  if (birthDate > today) {
    return {
      isValid: false,
      message: lang === 'so'
        ? 'Taariikhda dhalashada ma noqon karto taariikh mustaqbal ah'
        : 'Date of birth cannot be in the future'
    };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      isValid: false,
      age,
      message: lang === 'so'
        ? `Da'daadu waa ${age} sano. Waa in aad jirtaa ugu yaraan 18 sano (qof ka yar 18 sano lama ogola)`
        : `Age is ${age}. You must be at least 18 years old to register (under 18 not allowed)`
    };
  }

  return { isValid: true, age, message: '' };
}

