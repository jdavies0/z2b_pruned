/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var orderStatus = {
    Created: {code: 1, text: 'Schedule Created'},
    Bought: {code: 2, text: 'Schedule Registered'},
    Cancelled: {code: 3, text: 'Schedule Cancelled'},
    Ordered: {code: 4, text: 'Schedule Submitted to Cashier'},
    ShipRequest: {code: 5, text: 'Shipping Requested'},
    Delivered: {code: 6, text: 'Schedule Delivered'},
    Backordered: {code: 7, text: 'Schedule Backordered'},
    Dispute: {code: 8, text: 'Schedule Disputed'},
    Resolve: {code: 9, text: 'Schedule Dispute Resolved'},
    PayRequest: {code: 10, text: 'Payment Requested'},
    Authorize: {code: 11, text: 'Payment Approved'},
    RefundRequested: {code: 12, text: 'Schedule Refund Requested'},
    Refunded: {code: 13, text: 'Schedule Refunded'},
    Paid: {code: 14, text: 'Payment Processed'},
    Delivering: {code: 15, text: 'Schedule being Delivered'},
    Dropped: {code: 16, text: 'Course Dropped'},
    Denied: {code:17, text: 'Schedule Denied'},
    Partial: {code:18, text: 'Partial Payment Made'},
    RefundDenied: {code:19, text: 'Refund Denied'}
};

var ns = 'org.acme.Z2BTestNetwork';

/**
 * create an order to purchase
 * @param {org.acme.Z2BTestNetwork.CreateOrder} purchase - the order to be processed
 * @transaction
 */
function CreateOrder(purchase) {
    purchase.order.buyer = purchase.buyer;
    purchase.order.amount = purchase.amount;
    purchase.order.seller = purchase.seller;
    purchase.order.financeCo = purchase.financeCo;
    purchase.order.created = new Date().toISOString();
    purchase.order.status = JSON.stringify(orderStatus.Created);
    // kicking this to auto-Buy
    purchase.order.bought = new Date().toISOString();
    purchase.order.status = JSON.stringify(orderStatus.Bought);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                //z2bEmit('Created', purchase.order);
                z2bEmit('Bought', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}
/**
 * Record a request to purchase
 * @param {org.acme.Z2BTestNetwork.Buy} purchase - the order to be processed
 * @transaction
 */
function Buy(purchase) {
    if ( (purchase.order.status == JSON.stringify(orderStatus.Created))
        || (purchase.order.status == JSON.stringify(orderStatus.Denied)) )
    {
        purchase.order.buyer = purchase.buyer;
        purchase.order.seller = purchase.seller;
        purchase.order.bought = new Date().toISOString();
        purchase.order.status = JSON.stringify(orderStatus.Bought);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('Bought', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a request to cancel an order
 * @param {org.acme.Z2BTestNetwork.OrderCancel} purchase - the order to be processed
 * @transaction
 */
function OrderCancel(purchase) {
    purchase.order.buyer = purchase.buyer;
    purchase.order.seller = purchase.seller;
    purchase.order.financeCo = purchase.financeCo
    purchase.order.cancelled = new Date().toISOString();
    purchase.order.status = JSON.stringify(orderStatus.Cancelled);
    purchase.order.cancel = purchase.cancel;
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('Cancelled', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}

/**
 * Record a request to order by seller from supplier
 * Repurposed to act as submit to cashier (approve)
 * @param {org.acme.Z2BTestNetwork.OrderFromSupplier} purchase - the order to be processed
 * @transaction
 */
function OrderFromSupplier(purchase) {
    if ( purchase.order.status == JSON.stringify(orderStatus.Bought) )
    {
        purchase.order.financeCo = purchase.financeCo;
        purchase.order.ordered = new Date().toISOString();
        purchase.order.status = JSON.stringify(orderStatus.Ordered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('Ordered', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a request to ship by supplier to shipper
 * @param {org.acme.Z2BTestNetwork.RequestShipping} purchase - the order to be processed
 * @transaction
 */
function RequestShipping(purchase) {
    if ( (purchase.order.status == JSON.stringify(orderStatus.Ordered))
    || (purchase.order.status == JSON.stringify(orderStatus.Backordered)) )
    {
        purchase.order.shipper = purchase.shipper;
        purchase.order.requestShipment = new Date().toISOString();
        purchase.order.status = JSON.stringify(orderStatus.ShipRequest);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('ShipRequest', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a delivery by shipper
 * @param {org.acme.Z2BTestNetwork.Delivering} purchase - the order to be processed
 * @transaction
 */
function Delivering(purchase) {
    if ( (purchase.order.status == JSON.stringify(orderStatus.ShipRequest))
    || (JSON.parse(purchase.order.status).code == orderStatus.Delivering.code) )
    {
        purchase.order.delivering = new Date().toISOString();
        var _status = orderStatus.Delivering;
        _status.text += '  '+purchase.deliveryStatus;
        purchase.order.status = JSON.stringify(_status);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('DeliveryStarted', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
/**
 * Record a delivery by shipper
 * @param {org.acme.Z2BTestNetwork.Deliver} purchase - the order to be processed
 * @transaction
 */
function Deliver(purchase) {
    if ( (purchase.order.status == JSON.stringify(orderStatus.ShipRequest))
    || (JSON.parse(purchase.order.status).code == orderStatus.Delivering.code) )
    {
        purchase.order.delivered = new Date().toISOString();
        purchase.order.status = JSON.stringify(orderStatus.Delivered);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('DeliveryCompleted', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
 /**
 * Record a request for payment by the seller
 * @param {org.acme.Z2BTestNetwork.RequestPayment} purchase - the order to be processed
 * @transaction
 */
function RequestPayment(purchase) {
    if ( (JSON.parse(purchase.order.status).text == orderStatus.Ordered.text) )
        {
            purchase.order.status = JSON.stringify(orderStatus.PayRequest);
            purchase.order.financeCo = purchase.financeCo;
            purchase.order.paymentRequested = new Date().toISOString();
            return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('PaymentRequested', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
        }
}
 /**
 * Make a payment to the cashier
 * 
 * Record a payment to the seller
 * @param {org.acme.Z2BTestNetwork.AuthorizePayment} purchase - the order to be processed
 * @transaction
 */
function AuthorizePayment(purchase) {
    if ( (JSON.parse(purchase.order.status).text == orderStatus.PayRequest.text)
        || (JSON.parse(purchase.order.status).text == orderStatus.Partial.text) )
    {
        purchase.order.status = JSON.stringify(orderStatus.Partial);
        purchase.order.approved = new Date().toISOString();
        purchase.order.lastPayment = new Date().toISOString();
        purchase.order.tuitionPaid += purchase.tuitionPaid;
        // mark the purchase as paid in full if tuitition paid is >= tuition amount
        if ( purchase.order.tuitionPaid >= purchase.order.amount )
        {
            purchase.order.status = JSON.stringify(orderStatus.Paid);
            purchase.order.paid = new Date().toISOString();    
        }
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('PaymentAuthorized', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
    }
}
 /**
 * Cashier accepts the payment
 * 
 * Record a payment to the seller
 * @param {org.acme.Z2BTestNetwork.Pay} purchase - the order to be processed
 * @transaction
 */
function Pay(purchase) {
    if (JSON.parse(purchase.order.status).text == orderStatus.Authorize.text )
        {purchase.order.status = JSON.stringify(orderStatus.Paid);
        purchase.order.paid = new Date().toISOString();
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('Paid', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
        }
}
 /**
 * Record a dispute by the buyer
 * @param {org.acme.Z2BTestNetwork.Dispute} purchase - the order to be processed
 * @transaction
 */
function Dispute(purchase) {
    purchase.order.status = JSON.stringify(orderStatus.Dispute);
    purchase.order.dispute = purchase.dispute;
    purchase.order.disputeOpened = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('DisputeOpened', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}
 /**
 * Resolve a seller initiated dispute
 * @param {org.acme.Z2BTestNetwork.Resolve} purchase - the order to be processed
 * @transaction
 */
function Resolve(purchase) {
    purchase.order.status = JSON.stringify(orderStatus.Resolve);
    purchase.order.resolve = purchase.resolve;
    purchase.order.disputeResolved = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('Resolved', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}
 /**
 * Record a refund to the buyer
 * @param {org.acme.Z2BTestNetwork.Refund} purchase - the order to be processed
 * @transaction
 */
function Refund(purchase) {
    purchase.order.status = JSON.stringify(orderStatus.Refunded);
    purchase.order.tuitionRefunded += parseInt(purchase.tuitionRefunded, 10);
    purchase.order.orderRefunded = new Date().toISOString();
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('Refunded', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}

/**
 * Record a refund request from the buyer
 * @param {org.acme.Z2BTestNetwork.RequestRefund} purchase - the order to be processed
 * @transaction
 */
function RequestRefund(purchase) {
    if (purchase.order.paid != '' || purchase.order.lastPayment != '')
    {
        purchase.order.status = JSON.stringify(orderStatus.RefundRequested);
        purchase.order.refundRequest = purchase.refundRequest;
        purchase.order.refundRequested = new Date().toISOString();
        // update the amount refunded
        purchase.order.refAmtRequested = parseInt(purchase.refAmtRequested, 10);
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('RefundRequested', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
    }
}

/**
 * Deny the refund with reason
 * @param {org.acme.Z2BTestNetwork.DenyRefund} purchase - the registration to be processed
 * @transaction
 */
function DenyRefund(purchase) {
    if (purchase.order.RefundRequested != '')
    {
        purchase.order.status = JSON.stringify(orderStatus.RefundDenied);
        purchase.order.refundDeny = purchase.refundDeny;
        purchase.order.refundDenied = new Date().toISOString();
        return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
            .then(function (assetRegistry) {
                return assetRegistry.update(purchase.order)
                .then (function (_res) 
                {
                    z2bEmit('RefundDenied', purchase.order);
                    return (_res);
                }).catch(function(error){return(error);});
            });
    }
}

 /**
 * Record a backorder by the supplier
 * @param {org.acme.Z2BTestNetwork.BackOrder} purchase - the order to be processed
 * @transaction
 */
function BackOrder(purchase) {
    purchase.order.status = JSON.stringify(orderStatus.Backordered);
    purchase.order.backorder = purchase.backorder;
    purchase.order.dateBackordered = new Date().toISOString();
    purchase.order.provider = purchase.provider;
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
    .then(function (assetRegistry) {
        return assetRegistry.update(purchase.order)
        .then (function (_res) 
        {
            z2bEmit('Backordered', purchase.order);
            return (_res);
        }).catch(function(error){return(error);});
    });
}

/**
 * Drop an entire schedule
 * @param {org.acme.Z2BTestNetwork.DropSchedule} purchase - the schedule to be processed
 * @transaction
 */
function DropSchedule(purchase) {
    purchase.order.buyer = purchase.buyer;
    purchase.order.seller = purchase.seller;
    purchase.order.financeCo = purchase.financeCo;
    purchase.order.dropped = new Date().toISOString();
    purchase.order.status = JSON.stringify(orderStatus.Dropped);
    purchase.order.drop = purchase.drop;
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then (function (_res) 
            {
                z2bEmit('Dropped', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}

/**
 * Registrar Denies registration
 * @param {org.acme.Z2BTestNetwork.DenySchedule} purchase - the schedule to be processed
 * @transaction
 */
function DenySchedule(purchase) {
    purchase.order.buyer = purchase.buyer;
    purchase.order.seller = purchase.seller;
    purchase.order.denied = new Date().toISOString();
    purchase.order.deny = purchase.deny;
    purchase.order.status = JSON.stringify(orderStatus.Denied);
    return getAssetRegistry('org.acme.Z2BTestNetwork.Order')
        .then(function (assetRegistry) {
            return assetRegistry.update(purchase.order)
            .then(function (_res)
            {
                z2bEmit('Denied', purchase.order);
                return (_res);
            }).catch(function(error){return(error);});
        });
}

/**
 * display using console.log the properties of each property in the inbound object
 * @param {displayObjectProperties} _string - string name of object
 * @param {displayObjectProperties}  _object - the object to be parsed
 * @utility
 */
function displayObjectValues (_string, _object)
{
    for (var prop in _object){
        console.log(_string+'-->'+prop+':\t '+(((typeof(_object[prop]) === 'object') || (typeof(_object[prop]) === 'function'))  ? typeof(_object[prop]) : _object[prop]));
    }
}

/**
 * z2bEmit emits an event of the type passed in on param 1
 * all Z2BEvents have one extra parameter, which is the order identifier
 * @param {String} _event - the event to be emitted
 * @param {org.acme.Z2BTestNetwork.Order} _order - the orderID to be associated with this event
 */
function z2bEmit(_event, _order)
{
    var method = 'z2bEmit';
    var factory = getFactory();
    var z2bEvent = factory.newEvent(ns, _event);
    z2bEvent.orderID = _order.$identifier;
    z2bEvent.buyerID = _order.buyer.$identifier;
    switch (_event)
    {
        case 'Created':

        break;
        case 'Bought':
        case 'Denied':
            z2bEvent.sellerID = _order.seller.$identifier;
            z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        case 'PaymentRequested':
        case 'RefundRequested':
        case 'RefundDenied':
        z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        case 'Ordered':
        case 'Cancelled':
        case 'Backordered':
        case 'Dropped':
            z2bEvent.sellerID = _order.seller.$identifier;
            z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        case 'ShipRequest':
        case 'DeliveryStarted':
        case 'DeliveryCompleted':
            z2bEvent.sellerID = _order.seller.$identifier;
        break;
        case 'DisputeOpened':
        case 'Resolved':
        case 'Paid':
            z2bEvent.sellerID = _order.seller.$identifier;
            z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        case 'Refunded':
            z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        case 'PaymentAuthorized':
            z2bEvent.financeCoID = _order.financeCo.$identifier;
        break;
        default:
        break;
    }
    emit(z2bEvent);
    return 
}