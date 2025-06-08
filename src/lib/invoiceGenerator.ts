
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvoiceData } from './types';
import { format } from 'date-fns';

export function generateInvoicePdf(invoiceData: InvoiceData) {
  const doc = new jsPDF();

  // --- Document Settings ---
  const FONT_SIZE_NORMAL = 10;
  const FONT_SIZE_LARGE = 16;
  const FONT_SIZE_XLARGE = 20;
  const FONT_SIZE_SMALL = 8;
  const MARGIN = 15;
  const LINE_HEIGHT = 6; // Adjusted line height
  const LOGO_WIDTH = 40;
  const LOGO_HEIGHT = 20; // Adjusted for better aspect ratio placeholder

  // --- Header Section using autoTable ---
  autoTable(doc, {
    startY: MARGIN,
    theme: 'plain', // No borders for this table, just for layout
    styles: { fontSize: FONT_SIZE_NORMAL, cellPadding: 0.5 },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Company Info
      1: { cellWidth: 'auto', halign: 'right' }, // Invoice Details
    },
    body: [
      [
        {
          content: (invoiceData.companyLogoUrl ? `[Your Logo Here - ${LOGO_WIDTH}x${LOGO_HEIGHT}px]` : invoiceData.companyName) +
                   `\n${invoiceData.companyAddress}` +
                   `\n${invoiceData.companyContact}`,
          styles: {
            fontSize: invoiceData.companyLogoUrl ? FONT_SIZE_SMALL : FONT_SIZE_LARGE,
            fontStyle: invoiceData.companyLogoUrl ? 'normal' : 'bold',
            valign: 'top',
            minCellHeight: LOGO_HEIGHT + LINE_HEIGHT, // Ensure space for logo/company name
          },
        },
        {
          content: `INVOICE\n\nInvoice #: ${invoiceData.invoiceNumber}\nDate: ${invoiceData.invoiceDate}\nPayment ID: ${invoiceData.paymentId}`,
          styles: {
            fontSize: FONT_SIZE_NORMAL,
            halign: 'right',
            valign: 'top',
            fontStyle: 'bold',
            cellPadding: { top: 0, right: 0, bottom: 0, left: 20 } // Add some left padding to separate from company info
          },
        },
      ],
    ],
    // Example for adding logo if you have it as a Data URL or preloaded image:
    // didDrawCell: (data) => {
    //   if (data.section === 'body' && data.column.index === 0 && data.row.index === 0 && invoiceData.companyLogoUrl) {
    //     // Assuming invoiceData.companyLogoUrl is a DataURL or preloaded image object
    //     // doc.addImage(invoiceData.companyLogoUrl, 'PNG', data.cell.x + 2, data.cell.y + 2, LOGO_WIDTH, LOGO_HEIGHT);
    //   }
    // },
  });


  let lastTableY = (doc as any).lastAutoTable.finalY || MARGIN + LOGO_HEIGHT + 25;

  // --- Bill To Section ---
  let billToY = lastTableY + LINE_HEIGHT * 2;
  doc.setFontSize(FONT_SIZE_NORMAL);
  doc.setFont('helvetica', 'bold');
  doc.text("BILL TO:", MARGIN, billToY);
  billToY += LINE_HEIGHT;
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.userName, MARGIN, billToY);
  billToY += LINE_HEIGHT / 2;
  doc.text(invoiceData.userEmail, MARGIN, billToY);

  // --- Line Items Table ---
  const tableStartY = billToY + LINE_HEIGHT * 2;
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price (INR)', 'Amount (INR)']],
    body: [
      [
        invoiceData.planName,
        1,
        invoiceData.planPrice.toFixed(2),
        invoiceData.planPrice.toFixed(2)
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181], textColor: [255,255,255] },
    styles: { fontSize: FONT_SIZE_NORMAL, cellPadding: 2.5 },
    columnStyles: {
        0: { cellWidth: 'auto'},
        1: { halign: 'center', cellWidth: 20},
        2: { halign: 'right', cellWidth: 40},
        3: { halign: 'right', cellWidth: 40}
    },
    didParseCell: function (data) {
        if (data.section === 'head') {
            if(data.column.index === 2 || data.column.index === 3) {
                 data.cell.styles.halign = 'right';
            }
        }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // --- Totals ---
  const totalsX = doc.internal.pageSize.getWidth() - MARGIN - 70; // Adjusted X for wider labels
  let totalsY = finalY + LINE_HEIGHT * 2;

  doc.setFontSize(FONT_SIZE_NORMAL);
  doc.setFont('helvetica', 'normal'); // Regular for labels
  doc.text("Subtotal:", totalsX, totalsY, {halign: 'left'});
  doc.setFont('helvetica', 'bold'); // Bold for amounts
  doc.text(`₹${invoiceData.planPrice.toFixed(2)}`, doc.internal.pageSize.getWidth() - MARGIN, totalsY, { align: 'right'});
  totalsY += LINE_HEIGHT;

  doc.setFont('helvetica', 'bold');
  doc.text("Total Amount (INR):", totalsX, totalsY, {halign: 'left'});
  doc.text(`₹${invoiceData.planPrice.toFixed(2)}`, doc.internal.pageSize.getWidth() - MARGIN, totalsY, { align: 'right'});

  // --- Footer Notes & Signature ---
  // Position footer elements relative to the bottom of the page
  const pageHeight = doc.internal.pageSize.getHeight();
  let footerY = pageHeight - MARGIN - 15; // Start higher up for more space

  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setFont('helvetica', 'italic');
  doc.text("Thank you for your business!", MARGIN, footerY);
  footerY += LINE_HEIGHT / 1.5;
  doc.text("This is a computer-generated invoice and does not require a physical signature.", MARGIN, footerY);
  footerY += LINE_HEIGHT / 1.5;
  doc.text(`If you have any questions concerning this invoice, please contact ${invoiceData.companyContact}`, MARGIN, footerY);


  // --- Save PDF ---
  doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
}
