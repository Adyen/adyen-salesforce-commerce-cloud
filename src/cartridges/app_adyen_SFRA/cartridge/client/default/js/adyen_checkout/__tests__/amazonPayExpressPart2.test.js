/**
 * @jest-environment jsdom
 */

let select;
let data;
const {saveShopperDetails, constructAddress, wrapChangeAddressButton, showAddressDetails} = require('../../amazonPayExpressPart2');

beforeEach(async () => {
  document.body.innerHTML = `
        <select id="shippingMethods">
          <option> Child #1 </option> 
          <option> Child #2 </option>  
        </select>
      `;
  data = {
    shippingMethods: [
      {
        ID: 'EUR001',
      },
      {
        ID: 'EUR002',
      },
    ],
  };
});

describe('AmazonPay Express', () => {
  it('Should show the updated shipping methods', async () => {
    select = document.getElementById('shippingMethods');
    $.ajax = jest.fn(({ success }) => {
      success(data);
      return { fail: jest.fn() };
    });
    saveShopperDetails(data);
    expect(
      select.innerHTML.includes('EUR001') &&
        select.innerHTML.includes('EUR002'),
    );
  });

  it('Should construct address correctly', () => {
    const shopperDetails = {
      shippingAddress: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'Anytown',
        country: 'USA'
      },
      paymentDescriptor: 'Visa ending in 1234'
    };
    const expectedAddress = "John Doe\n123 Main St Anytown USA ";
    expect(constructAddress(shopperDetails)).toBe(expectedAddress);
  });

  it('Should wrap change address button', () => {
    document.body.innerHTML = `
      <button class="adyen-checkout__button adyen-checkout__button--ghost adyen-checkout__amazonpay__button--changeAddress"></button>
      <button class="editAddressBtn"></button>
    `;
    wrapChangeAddressButton();
    const changeDetailsBtn = document.querySelector('.adyen-checkout__button.adyen-checkout__button--ghost.adyen-checkout__amazonpay__button--changeAddress');
    const editAddressBtn = document.querySelector('.editAddressBtn');
    editAddressBtn.click();
    expect(changeDetailsBtn.classList.contains('invisible')).toBe(true);
  });  

  it('Should show address details', () => {
	document.body.innerHTML = `
	  <div id="address"></div>
	  <div id="paymentStr"></div>
	  <div id="amazon-container"></div>
	  <select id="shippingMethods">
		<option> Child #1 </option> 
		<option> Child #2 </option>  
	  </select>
	  <div class="coupons-and-promos"></div>
	  <button class="adyen-checkout__button adyen-checkout__button--standalone adyen-checkout__button--pay"></button>
	  <button class="adyen-checkout__button adyen-checkout__button--ghost adyen-checkout__amazonpay__button--changeAddress"></button>
	  <div id="amazonPayAddressDetails">
	  	<div> Child #1 </div> 
	  </div>
	`;
  
	const shopperDetails = {
	  shippingAddress: {
		name: 'John Doe',
		street: '123 Main St',
		city: 'Anytown',
		country: 'USA'
	  },
	  paymentDescriptor: 'Visa ending in 1234'
	};
  
	showAddressDetails(shopperDetails);
  
	const addressElement = document.getElementById('address');
	const paymentDescriptorElement = document.getElementById('paymentStr');
	const payBtn = document.querySelector('.adyen-checkout__button.adyen-checkout__button--standalone.adyen-checkout__button--pay');
  
	expect(addressElement.innerText).toBe("John Doe\n123 Main St Anytown USA ");
	expect(paymentDescriptorElement.innerText).toBe('Visa ending in 1234');
	expect(payBtn.style.background).toBe('rgb(0, 161, 224)');
  });
});
