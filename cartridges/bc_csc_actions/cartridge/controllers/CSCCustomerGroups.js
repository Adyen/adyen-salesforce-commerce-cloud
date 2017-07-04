var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var customerMgr = require('dw/customer/CustomerMgr');
var txn = require('dw/system/Transaction');

/**
 * Displays all static and dynamic customer groups and provide template to assign and unassign customer groups. 
 */
exports.Start = function(){

	try {
		ISML.renderTemplate('customer/customer_groups.isml', {"customer" : customer});
	} catch (e) {
		Logger.error('Error while rendering template ' + templateName);
		throw e;
	}
}

/**
 * Assigns a given customer group to a customer
 */
exports.Assign = function(){

	this.action = 'assign';

	var customerGroupID = request.httpParameterMap.get('customer_group');

	var success = true;
	if(customerGroupID){
		this.groupToAssign = customerMgr.getCustomerGroup(customerGroupID);

		try{
			if(this.groupToAssign != null){
				txn.begin();
				this.groupToAssign.assignCustomer(customer);
				txn.commit();
			}
		}
		catch (e) {
			dw.system.Logger.error('Error while assigning customer group with id ' + customerGroupID + ':' + e);
			success =  false;
		}
	}
	else{
		success = false;
	}

	this.success = success;

	try {
		ISML.renderTemplate('customer/customer_groups_confirmation.isml', this);
	} catch (e) {
		Logger.error('Error while rendering template ' + templateName);
		throw e;
	}

}

/**
 * Removes a given customer group from a customer
 */
exports.Remove = function(){

	this.action = 'unassign';

	var customerGroupID = request.httpParameterMap.get('customer_group');
	this.groupToUnassign = customerMgr.getCustomerGroup(customerGroupID);

	var success = true;

	try{
		if(this.groupToUnassign != null){
			var txn = require('dw/system/Transaction');
			txn.begin();
			this.groupToUnassign.unassignCustomer(customer);
			txn.commit();
		}
	}
	catch (e) {
		Logger.error('Error while assigning customer group with id ' + customerGroupID + ':' + e);
		success =  false;
	}

	this.success = success;

	try {
		ISML.renderTemplate('customer/customer_groups_confirmation.isml', this);
	} catch (e) {
		error('Error while rendering template ' + templateName);
		throw e;
	}

}

exports.Start.public = true;
exports.Assign.public = true;
exports.Remove.public = true;
