// ساخت و دانلود فایل Word با docx.js

import { RESOURCE, RESOURCE_LABEL_PLURAL } from '../config.js';
import { getImageUrl } from '../utils/format.js';
import { getStatusText } from '../utils/status.js';
import { fetchImageBlob, convertImageForDocx } from '../utils/image.js';
import { downloadBlob } from '../utils/download.js';

export const isDocxAvailable = () => Boolean(window.docx);

async function loadItemImage(item) {
    const blob = await fetchImageBlob(getImageUrl(item.imageUrl));
    return blob ? convertImageForDocx(blob) : null;
}

export async function exportItemsToWord(resourceType, items) {
    const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = window.docx;

    // متن راست‌به‌چپ؛ بدون alignment صریح تا در پاراگراف bidi ابتدای خط (= راست) رعایت شود
    const rtlRun = (text, options = {}) => new TextRun({ text, rightToLeft: true, ...options });

    const multilineRuns = (text, size) =>
        String(text).split(/\r?\n/).map((line, index) =>
            rtlRun(line, index > 0 ? { size, break: 1 } : { size })
        );

    const images = await Promise.all(items.map(loadItemImage));

    const label = RESOURCE_LABEL_PLURAL[resourceType] || RESOURCE_LABEL_PLURAL[RESOURCE.DEMANDS];
    const children = [
        new Paragraph({
            children: [rtlRun(`گزارش دسته‌ای ${label} تاییدشده شوکت نیوز`)],
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
        }),
    ];

    items.forEach((item, index) => {
        children.push(
            new Paragraph({
                children: [
                    rtlRun(`#${index + 1} ${item.title || 'بدون عنوان'} (${getStatusText(item.status)})`, {
                        bold: true,
                        size: 28,
                    }),
                ],
                spacing: { before: 300 },
                bidirectional: true,
            }),
            new Paragraph({
                children: multilineRuns(item.description || 'بدون متن', 24),
                bidirectional: true,
            })
        );

        const image = images[index];
        if (image) {
            children.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: image.data,
                            type: 'png',
                            transformation: { width: image.width, height: image.height },
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 150, after: 150 },
                })
            );
        }
    });

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${resourceType}-approved-export-${Date.now()}.docx`);
}
