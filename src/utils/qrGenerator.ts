export function generateQRCode(text: string, size: number = 200): string {
  // Using a simple QR code generation approach
  // In production, you might want to use a more sophisticated library
  const qrServer = 'https://api.qrserver.com/v1/create-qr-code/';
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: text,
    format: 'png',
    bgcolor: 'ffffff',
    color: '000000',
    qzone: '1',
    margin: '0',
    style: 'square',
    ecc: 'L'
  });
  
  return `${qrServer}?${params.toString()}`;
}

export function generatePaymentQRCode(amount: number, upiId?: string): string {
  // Default UPI ID - you can change this to your own UPI ID
  const defaultUpiId = "your-upi-id@paytm"; // Change this line to your UPI ID
  
  const upiLink = `upi://pay?pa=${upiId || defaultUpiId}&am=${amount}&cu=INR&tn=Baba Dhudh Bhandar Payment`;
  return generateQRCode(upiLink);
}