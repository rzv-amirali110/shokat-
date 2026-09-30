const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require('docx');

class DocxService {
    static async generateCategoryReportBuffer(categoryTitle, items) {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: categoryTitle,
                        heading: HeadingLevel.TITLE,
                        bidirectional: true
                    }),
                    ...items.flatMap((item, index) => {
                        const dateStr = new Date(item.createdAt).toLocaleDateString('fa-IR');
                        return [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `مورد ${index + 1} (${dateStr}):`, bold: true }),
                                ],
                                bidirectional: true
                            }),
                            new Paragraph({
                                text: item.text,
                                bidirectional: true
                            }),
                            new Paragraph({ text: '----------------------------------------' })
                        ];
                    })
                ]
            }]
        });

        return await Packer.toBuffer(doc);
    }
}

module.exports = DocxService;