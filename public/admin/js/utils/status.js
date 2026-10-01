// متن و کلاس‌های وضعیت

import { STATUS } from '../config.js';

export function getStatusText(status) {
    switch (status) {
        case STATUS.APPROVED: return 'تایید شده';
        case STATUS.REJECTED: return 'رد شده';
        default: return 'در انتظار تایید';
    }
}

export function getStatusBadgeClass(status) {
    switch (status) {
        case STATUS.APPROVED: return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        case STATUS.REJECTED: return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
        default: return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
}
