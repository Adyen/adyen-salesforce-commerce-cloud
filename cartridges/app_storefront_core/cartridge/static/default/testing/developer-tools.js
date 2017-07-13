$(document).ready(function(){
	
	var varDevTools = {

		// display width, useful for testing media queries		
		 viewport : "<span style='margin: 0 10px;'>Viewport: " + $(window).width() + "</span>"
		
		// list of all comps available 
		,compList : [
            'about',
            'cart',
            'cat',
            'checkout',
            'checkout_step2_billing',
            'checkout_step3_order',
            'checkout_-tooltip_rollover',
            'checkoutreceipt',
            'comparebucket',
            'compareproducts',
            'contact',
            'createaccount',
            'giftcertificates',
            'home',
            'ma_giftreg_createregistry',
            'ma_giftreg_registrantsview',
            'ma_giftreg_userregistries',
            'ma_wishlist_authenticateduser',
            'ma_wishlist_publicview',
            'ma_wishlist_searchresults',
            'minicart',
            'myaccount',
            'myaccount_addressbook',
            'myaccount_orderhistory',
            'myaccountlogin',
            'myaccountlogin_noresultsfound',
            'pdp',
            'pdp_bundle',
            'pdp_outfit',
            'pdp_InviteMyFriends',
            'pdp_limited_inventory_mess',
            'pdp_popup_howthisworks',
            'pdp_popup_productreview',
            'pdp_popup_productreviewtab',
            'pdp_popup_sendtoafriend',
            'pdp_popup_sizechart',
            'pdp_popup_telluswhatyouthink',
            'quickview',
            'quickview_product_set',
            'quickview_standardproduct_set',
            'searchresults',
            'searchresults_roresults',
            'storelocator',
            'storelocator_findastore',
            'storelocator_findastore_noresults',
            'storelocator_results'
		]
		
		,compSelect : function() {
			var compDropDown = '<select id="compList">';
			for( i = 0; i < this.compList.length; i++) {
				compDropDown = compDropDown + '<option value="' + this.compList[i] + '.png">' + this.compList[i] + '</option>';
			}
			compDropDown = compDropDown + '</select><span class="compToggle" style="margin: 0 10px;cursor:pointer;">Toggle Comp</span>';
			return compDropDown;
		}
		
		
	}
	
	
	// insert toolbar and comp div
	$('body')
		.css('margin-top','25px')
		.append(
			"<div style='background:green;color:white;line-height: 20px;padding: 0 1%;position:absolute;top:0;width:98%;'>" +
			varDevTools.viewport +
			//varDevTools.compSelect() +
			"</div>" +
			"<div id='compOverlay' style='display:none;opacity:0.3;filter:alpha(opacity=30);position:absolute;top:30px;text-align:center;width:100%;z-index:9999;'><img src='" + devUrl + "/design-comps/" + varDevTools.compList[0]+ ".png'></div>"
		);

	// attach toggle functionality
	$('.compToggle').click(function(){
		$('#compOverlay img').attr('src', devUrl + "/design-comps/" + $('#compList').val());
		$('#compOverlay').toggle();
	});

});