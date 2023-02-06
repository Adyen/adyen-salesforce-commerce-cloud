export class PaymentData {
  GiroPay = {
    bankName: 'GENODETT488',
    sc: '10',
    extensionSc: '4000',
    customerIban: 'DE36444488881234567890',
    customerName: 'Klaus Giro',
  };
  SepaDirectDebit = {
    accountName: 'A. Klaassen',
    iban: 'NL13TEST0123456789',
    country: 'NL',
  };
  PayPal = {
    username: process.env.PAYPAL_USERNAME,
    password: process.env.PAYPAL_PASSWORD,
  };
  AmazonPay = {
    username : process.env.AMAZONPAY_USERNAME,
    password: process.env.AMAZONPAY_PASSWORD,
  }
}
