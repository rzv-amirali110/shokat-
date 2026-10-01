import { RESOURCE } from '../config.js';
import { apiRequest, extractList } from './http.js';

const VALID_RESOURCES = Object.values(RESOURCE);

function itemPath(resourceType, id, suffix = '') {
    if (!VALID_RESOURCES.includes(resourceType)) {
        throw new Error(`نوع منبع نامعتبر است: ${resourceType}`);
    }
    return `/${resourceType}/${encodeURIComponent(id)}${suffix}`;
}

/**
 * دریافت هم‌زمان مطالبات و خاطرات.
 * اگر یکی از دو درخواست شکست بخورد، دیگری همچنان برگردانده می‌شود.
 */
export async function fetchAllSubmissions() {
    const results = await Promise.allSettled(VALID_RESOURCES.map((type) => apiRequest(`/${type}`)));

    const items = [];
    const failed = [];

    results.forEach((result, index) => {
        const resourceType = VALID_RESOURCES[index];
        if (result.status === 'fulfilled') {
            extractList(result.value, 'items').forEach((item) => items.push({ ...item, resourceType }));
        } else {
            failed.push({ resourceType, error: result.reason });
        }
    });

    return { items, failed };
}

export const setSubmissionStatus = (resourceType, id, status) =>
    apiRequest(itemPath(resourceType, id, '/status'), { method: 'PATCH', body: { status } });

export const removeSubmission = (resourceType, id) =>
    apiRequest(itemPath(resourceType, id), { method: 'DELETE' });
