// اعتبارسنجی ورودی‌ها

import { MOBILE_REGEX } from '../config.js';

export function isValidMobile(mobile) {
    return MOBILE_REGEX.test(mobile);
}

/** حداقل ۸ کاراکتر شامل حروف، عدد و علامت */
export function validatePassword(password) {
    if (!password) return false;
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Zآ-ی]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
    return minLength && hasLetter && hasNumber && hasSymbol;
}
