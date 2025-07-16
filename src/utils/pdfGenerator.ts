import { MonthlyBill, Customer, Product } from '../types';
import { generatePaymentQRCode } from './qrGenerator';

// Helper function to aggregate entries by product
function aggregateEntriesByProduct(entries: any[], productMap: Map<string, Product>) {
  const productTotals = new Map();
  
  entries.forEach(entry => {
    const productId = entry.productId;
    const product = productMap.get(productId);
    
    if (productTotals.has(productId)) {
      const existing = productTotals.get(productId);
      existing.quantity += entry.quantity;
      existing.amount += entry.amount;
    } else {
      productTotals.set(productId, {
        productName: product?.name || 'Unknown Product',
        unit: product?.unit || 'units',
        quantity: entry.quantity,
        amount: entry.amount
      });
    }
  });
  
  return Array.from(productTotals.values());
}

export function generateAllCustomersBillPDF(
  bills: MonthlyBill[],
  customers: Customer[],
  products: Product[],
  month: string,
  year: number
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const productMap = new Map(products.map(p => [p.id, p]));
  const customerMap = new Map(customers.map(c => [c.id, c]));
  
  const monthName = getMonthName(parseInt(month));
  let totalGrandAmount = 0;

  const billsHtml = bills.map((bill, index) => {
    const customer = customerMap.get(bill.customerId);
    if (!customer) return '';
    
    totalGrandAmount += bill.grandTotal;
    
    return `
      <div class="bill-container ${index > 0 ? 'page-break' : ''}">
        <div class="header">
          <div class="company-name">🥛 Baba Dhudh Bhandar</div>
          <div class="company-tagline">Fresh Dairy Products Since 2003</div>
        </div>

        <div class="bill-info">
          <div class="customer-info">
            <div class="info-title">Customer Details</div>
            <div class="info-item"><strong>Name:</strong> ${customer.name}</div>
            ${customer.phone ? `<div class="info-item"><strong>Phone:</strong> ${customer.phone}</div>` : ''}
            ${customer.address ? `<div class="info-item"><strong>Address:</strong> ${customer.address}</div>` : ''}
          </div>
          <div class="bill-details">
            <div class="info-title">Bill Details</div>
            <div class="info-item"><strong>Bill No:</strong> ${bill.id.toUpperCase()}</div>
            <div class="info-item"><strong>Month:</strong> ${monthName} ${year}</div>
            <div class="info-item"><strong>Generated:</strong> ${new Date(bill.generatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${aggregateEntriesByProduct(bill.entries, productMap).map(item => {
              return `
                <tr>
                  <td>${item.productName}</td>
                  <td class="number">${item.quantity} ${item.unit}</td>
                  <td class="number">₹${item.amount.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          ${bill.previousDue > 0 ? `<div class="total-row">Previous Due: ₹${bill.previousDue.toFixed(2)}</div>` : ''}
          <div class="total-row">Current Month Total: ₹${bill.totalAmount.toFixed(2)}</div>
          <div class="total-row grand-total">Grand Total: ₹${bill.grandTotal.toFixed(2)}</div>
        </div>

        <div class="qr-section">
          <div><strong>Scan to Pay</strong></div>
          <div class="qr-code">
            <img src="${generatePaymentQRCode(bill.grandTotal)}" alt="Payment QR Code" style="width: 120px; height: 120px;" />
          </div>
          <div>Amount: ₹${bill.grandTotal.toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact us.</p>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Bills - ${monthName} ${year}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          font-size: 14px;
        }
        .page-break {
          page-break-before: always;
        }
        .bill-container {
          margin-bottom: 40px;
          padding: 20px;
          page-break-inside: avoid;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .company-tagline {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .customer-info, .bill-details {
          flex: 1;
        }
        .customer-info {
          margin-right: 20px;
        }
        .info-title {
          font-weight: bold;
          font-size: 16px;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .info-item {
          margin-bottom: 5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .items-table .number {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          margin-bottom: 10px;
          font-size: 16px;
        }
        .grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
          border-top: 2px solid #2563eb;
          padding-top: 10px;
        }
        .qr-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        .qr-code {
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
        .summary-page {
          page-break-before: always;
          text-align: center;
          padding: 40px 0;
        }
        .summary-title {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 20px;
        }
        .summary-stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        @media print {
          body {
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${billsHtml}
      
      <div class="summary-page">
        <div class="summary-title">Monthly Summary - ${monthName} ${year}</div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-number">${bills.length}</div>
            <div class="stat-label">Total Customers</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">₹${totalGrandAmount.toFixed(2)}</div>
            <div class="stat-label">Total Amount</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">₹${(totalGrandAmount / bills.length).toFixed(2)}</div>
            <div class="stat-label">Average per Customer</div>
          </div>
        </div>
        <p style="margin-top: 40px; color: #666;">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function generateBillPDF(
  bill: MonthlyBill, 
  customer: Customer, 
  products: Product[]
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const productMap = new Map(products.map(p => [p.id, p]));
  const qrCodeUrl = generatePaymentQRCode(bill.grandTotal);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Bill - ${customer.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .company-tagline {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .customer-info, .bill-details {
          flex: 1;
        }
        .customer-info {
          margin-right: 20px;
        }
        .info-title {
          font-weight: bold;
          font-size: 16px;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .info-item {
          margin-bottom: 5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .items-table .number {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          margin-bottom: 10px;
          font-size: 16px;
        }
        .grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
          border-top: 2px solid #2563eb;
          padding-top: 10px;
        }
        .qr-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        .qr-code {
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body {
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">🥛 Baba Dhudh Bhandar</div>
        <div class="company-tagline">Fresh Dairy Products Since 2003</div>
      </div>

      <div class="bill-info">
        <div class="customer-info">
          <div class="info-title">Customer Details</div>
          <div class="info-item"><strong>Name:</strong> ${customer.name}</div>
          ${customer.phone ? `<div class="info-item"><strong>Phone:</strong> ${customer.phone}</div>` : ''}
          ${customer.address ? `<div class="info-item"><strong>Address:</strong> ${customer.address}</div>` : ''}
        </div>
        <div class="bill-details">
          <div class="info-title">Bill Details</div>
          <div class="info-item"><strong>Bill No:</strong> ${bill.id.toUpperCase()}</div>
          <div class="info-item"><strong>Month:</strong> ${getMonthName(parseInt(bill.month))} ${bill.year}</div>
          <div class="info-item"><strong>Generated:</strong> ${new Date(bill.generatedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${aggregateEntriesByProduct(bill.entries, productMap).map(item => {
            return `
              <tr>
                <td>${item.productName}</td>
                <td class="number">${item.quantity} ${item.unit}</td>
                <td class="number">₹${item.amount.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="totals">
        ${bill.previousDue > 0 ? `<div class="total-row">Previous Due: ₹${bill.previousDue.toFixed(2)}</div>` : ''}
        <div class="total-row">Current Month Total: ₹${bill.totalAmount.toFixed(2)}</div>
        <div class="total-row grand-total">Grand Total: ₹${bill.grandTotal.toFixed(2)}</div>
      </div>

      <div class="qr-section">
        <div><strong>Scan to Pay</strong></div>
        <div class="qr-code">
          <img src="${qrCodeUrl}" alt="Payment QR Code" style="width: 150px; height: 150px;" />
        </div>
        <div>Amount: ₹${bill.grandTotal.toFixed(2)}</div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || 'Unknown';
}