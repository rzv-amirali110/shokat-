// نرمال‌سازی متن فارسی/عربی

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** تبدیل ارقام فارسی و عربی به انگلیسی */
export function normalizeDigits(value) {
    return String(value ?? '').replace(/[۰-۹٠-٩]/g, (ch) => {
        const persian = PERSIAN_DIGITS.indexOf(ch);
        return persian !== -1 ? String(persian) : String(ARABIC_DIGITS.indexOf(ch));
    });
}

/** نرمال‌سازی برای جست‌وجو (ی/ک عربی، ارقام، حروف بزرگ و کوچک) */
export function normalizeText(value) {
    return normalizeDigits(value)
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .toLowerCase()
        .trim();
}
