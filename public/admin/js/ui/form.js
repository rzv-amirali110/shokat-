// کمک‌ابزار فرم‌ها و جلوگیری از ارسال تکراری

const running = new Set();

/** فرمی که رویداد submit از آن آمده (در غیر این صورت null) */
export function getForm(event) {
    return event?.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
}

/**
 * اجرای یک عملیات async به‌صورت انحصاری:
 * تا پایان آن، اجرای دوباره (دابل‌کلیک / شنودگر تکراری) نادیده گرفته می‌شود.
 */
export async function runExclusive(key, task, form = null) {
    if (running.has(key)) return undefined;
    running.add(key);

    const buttons = form ? [...form.querySelectorAll('[type="submit"]')] : [];
    buttons.forEach((button) => { button.disabled = true; });

    try {
        return await task();
    } finally {
        buttons.forEach((button) => { button.disabled = false; });
        running.delete(key);
    }
}
