/**
 * Transaction Email Templates
 * ECOM-005: Send confirmation emails for purchases
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface TransactionEmailData {
  userName: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  paymentMethod?: string;
  itemName?: string;
  orderId?: string;
}

export function generateReceiptEmail(data: TransactionEmailData): EmailTemplate {
  const formattedAmount = `${data.currency} ${(data.amount / 100).toLocaleString()}`;
  return {
    subject: `Payment Receipt — ${data.transactionId}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Azeebo+</h1>
    <p style="margin: 8px 0 0; opacity: 0.8;">Payment Confirmation</p>
  </div>
  <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello ${data.userName},</p>
    <p>Your payment has been successfully processed.</p>
    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #666;">Amount</td><td style="padding: 4px 0; font-weight: bold; text-align: right;">${formattedAmount}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Transaction ID</td><td style="padding: 4px 0; text-align: right; font-family: monospace;">${data.transactionId}</td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Date</td><td style="padding: 4px 0; text-align: right;">${data.timestamp}</td></tr>
        ${data.paymentMethod ? `<tr><td style="padding: 4px 0; color: #666;">Payment Method</td><td style="padding: 4px 0; text-align: right;">${data.paymentMethod}</td></tr>` : ''}
        ${data.itemName ? `<tr><td style="padding: 4px 0; color: #666;">Item</td><td style="padding: 4px 0; text-align: right;">${data.itemName}</td></tr>` : ''}
      </table>
    </div>
    <p style="color: #666; font-size: 14px;">If you have questions about this transaction, contact support@azeeboplus.com.</p>
    <p style="color: #666; font-size: 14px;">Thank you for using Azeebo+!</p>
  </div>
</body>
</html>`,
    text: `Hello ${data.userName},\n\nYour payment has been processed.\n\nAmount: ${formattedAmount}\nTransaction ID: ${data.transactionId}\nDate: ${data.timestamp}\n\nThank you for using Azeebo+!`,
  };
}

export function generateSubscriptionConfirmationEmail(data: TransactionEmailData): EmailTemplate {
  return {
    subject: `Subscription Confirmed — ${data.transactionId}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Welcome to Azeebo+ Premium!</h1>
    <p style="margin: 8px 0 0; opacity: 0.9;">Your subscription is active</p>
  </div>
  <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello ${data.userName},</p>
    <p>Your subscription is now active. Enjoy unlimited access to premium content!</p>
    <div style="background: #f0f0ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Plan:</strong> ${data.itemName || 'Premium'}</p>
      <p style="margin: 8px 0 0;"><strong>Amount:</strong> ${data.currency} ${(data.amount / 100).toLocaleString()}/month</p>
    </div>
    <p style="color: #666; font-size: 14px;">Manage your subscription in Account Settings.</p>
  </div>
</body>
</html>`,
    text: `Hello ${data.userName},\n\nYour subscription to ${data.itemName || 'Premium'} is now active!\n\nAmount: ${data.currency} ${(data.amount / 100).toLocaleString()}/month\n\nThank you for using Azeebo+!`,
  };
}

export function generateFailedPaymentEmail(data: TransactionEmailData): EmailTemplate {
  return {
    subject: `Payment Failed — Action Required`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc3545; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello ${data.userName},</p>
    <p>We were unable to process your payment of ${data.currency} ${(data.amount / 100).toLocaleString()}.</p>
    <p>Please update your payment method or try again.</p>
    <a href="https://azeeboplus.com/account/billing" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Update Payment Method</a>
    <p style="color: #666; font-size: 14px;">If this is an error, contact support@azeeboplus.com.</p>
  </div>
</body>
</html>`,
    text: `Hello ${data.userName},\n\nYour payment of ${data.currency} ${(data.amount / 100).toLocaleString()} could not be processed.\n\nPlease update your payment method at https://azeeboplus.com/account/billing`,
  };
}

export function generateRefundEmail(data: TransactionEmailData): EmailTemplate {
  return {
    subject: `Refund Processed — ${data.transactionId}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #28a745; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Refund Processed</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello ${data.userName},</p>
    <p>Your refund of ${data.currency} ${(data.amount / 100).toLocaleString()} has been processed.</p>
    <p>Refund ID: <code>${data.transactionId}</code></p>
    <p>The refund will appear in your account within 5-10 business days.</p>
    <p style="color: #666; font-size: 14px;">Questions? Contact support@azeeboplus.com</p>
  </div>
</body>
</html>`,
    text: `Hello ${data.userName},\n\nYour refund of ${data.currency} ${(data.amount / 100).toLocaleString()} has been processed.\nRefund ID: ${data.transactionId}\n\nIt will appear in your account within 5-10 business days.`,
  };
}
