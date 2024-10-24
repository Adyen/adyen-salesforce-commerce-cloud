export class PaymentData {
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
  ClickToPay = {
	email : process.env.SFCC_USERNAME,
  }
}
