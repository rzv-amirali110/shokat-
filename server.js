const express = require('express');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } = require('docx');

const app = express();
const PORT = process.env.PORT || 3000;

// میان‌افزارها (Middlewares) برای پردازش JSON و سرو فایل‌های استاتیک
app.use(express.json());
app.use(express.static('public'));

// مسیرهای ذخیره‌سازی
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// اطمینان از وجود پوشه‌ها و فایل داده اولیه
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    // ساختار اولیه دیتابیس (فایل JSON)
    const initialData = { demands: [], memories: [], links: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// ۱. دریافت و ثبت پیام جدید از سمت کاربر
app.post('/api/submit', (req, res) => {
    try {
        const { category, text } = req.body; 
        
        // اعتبارسنجی ورودی‌ها
        if (!category || !text || text.trim() === '') {
            return res.status(400).json({ error: 'اطلاعات ناقص است. لطفا متن را وارد کنید.' });
        }

        // خواندن داده‌های فعلی
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);

        // بررسی صحت دسته‌بندی
        if (data[category] !== undefined) {
            // اضافه کردن پیام جدید به آرایه مربوطه
            data[category].push({
                text: text.trim(),
                createdAt: new Date().toISOString()
            });
            
            // ذخیره مجدد در فایل
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            return res.json({ success: true, message: 'اطلاعات با موفقیت ثبت شد.' });
        } else {
            return res.status(400).json({ error: 'دسته‌بندی نامعتبر است.' });
        }
    } catch (error) {
        console.error('Error saving submission:', error);
        return res.status(500).json({ error: 'خطای سرور در ذخیره‌سازی اطلاعات.' });
    }
});

// ۲. خروجی و دانلود فایل Word برای یک دسته‌بندی خاص (ویژه ادمین)
app.get('/api/download-word/:category', async (req, res) => {
    try {
        const { category } = req.params;
        
        // خواندن داده‌ها
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        const items = data[category];

        // بررسی وجود داده برای دسته‌بندی درخواستی
        if (!items || items.length === 0) {
            return res.status(404).send('هیچ داده‌ای برای این بخش ثبت نشده است.');
        }

        // عناوین مناسب برای هر فایل
        const titles = {
            demands: 'مطالبات و دغدغه‌های دانشجویان',
            memories: 'خاطرات دانشجویان',
            links: 'لینک‌های کانال‌ها'
        };

        // ساخت المان‌های داخل فایل Word
        const children = [
            new Paragraph({
                text: titles[category] || 'گزارش سامانه',
                heading: HeadingLevel.TITLE,
                bidirectional: true, // راست‌چین کردن (RTL) برای فارسی
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: '', spacing: { after: 200 } }) // فاصله بعد از عنوان
        ];

        // اضافه کردن هر آیتم به عنوان پاراگراف‌های مجزا
        items.forEach((item, index) => {
            const dateStr = new Date(item.createdAt).toLocaleDateString('fa-IR');
            
            // هدر هر آیتم
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `مورد ${index + 1} `, bold: true }),
                    new TextRun({ text: `(تاریخ ثبت: ${dateStr}):`, color: "555555" }),
                ],
                bidirectional: true,
                spacing: { before: 200, after: 100 }
            }));

            // متن اصلی آیتم
            children.push(new Paragraph({
                text: item.text,
                bidirectional: true,
                spacing: { after: 200 }
            }));

            // خط جداکننده
            children.push(new Paragraph({
                text: '--------------------------------------------------',
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }));
        });

        // پیکربندی نهایی سند Word
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        // تبدیل سند به فرمت قابل دانلود (Buffer)
        const buffer = await Packer.toBuffer(doc);
        const fileName = `${category}_${Date.now()}.docx`;
        
        // تنظیم هدرهای پاسخ برای شروع دانلود در مرورگر
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(buffer);

    } catch (error) {
        console.error('Error generating Word document:', error);
        res.status(500).send('خطا در تولید فایل Word.');
    }
});

// اجرای سرور
app.listen(PORT, () => {
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
});