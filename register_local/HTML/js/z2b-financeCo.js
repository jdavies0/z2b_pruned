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

// z2c-financeCo.js

'use strict';

let financeCOorderDiv = 'financeCOorderDiv';
let orders = [];
const financeCoID = 'easymoney@easymoneyinc.com';
const financeCoName = 'The Global Financier';
let f_notify = '#financeCo_notify';
let f_id = 'easymoney@easymoneyinc.com';
let f_count = '#financeCo_count';
let f_alerts;

/**
 * load the finance company User Experience
 */
function loadFinanceCoUX (nested)
{
    currentPage = 'financeCo.html';
    console.log ("in LoadFinanceUX");

    let toLoad = 'financeCo.html';
    if (buyers.length === 0)
        { $.when($.get(toLoad), deferredMemberLoad()).done(function (page, res)
        {setupFinanceCo(page[0], nested);});
    }
    else{
        $.when($.get(toLoad)).done(function (page)
        {setupFinanceCo(page,nested);});
    }
}
/**
 * @param {String} page HTML page to load
 */
function setupFinanceCo(page, nested)
{
    var tag ='#body';
    if (nested)
        tag = '#financebody';

    $(tag).empty();
    $(tag).append(page);
    f_alerts = [];
    if (f_alerts.length === 0)
      {$(f_notify).removeClass('on'); $(f_notify).addClass('off'); }
    else
      {$(f_notify).removeClass('off'); $(f_notify).addClass('on'); }
      updatePage( 'financeCo');
      updatePage( 'skins');
      let _clear = $('#financeCOclear');
    let _list = $('#financeCOorderStatus');
    let _orderDiv = $('#'+financeCOorderDiv);
    _clear.on('click', function(){_orderDiv.empty();});
    _list.on('click', function(){listFinanceOrders();});
    z2bSubscribe('FinanceCo', f_id);
}
/**
 * lists all orders for the selected financier
 */
function listFinanceOrders()
{
    let options = {};
    options.id = financeCoID;
    options.userID = options.id;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
    {
        console.log(_results.result);
        console.log(_results.orders);
        if (_results.orders.length < 1) {$('#'+financeCOorderDiv).empty(); $('#'+financeCOorderDiv).append(formatMessage('No orders for the financeCo: '+options.id));}
        else{orders = _results.orders; formatFinanceOrders($('#'+financeCOorderDiv), orders);}
    });
}

/**
 * used by the listOrders() function
 * formats the orders for a financier. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param {String} _target - string with div id prefaced by #
 * @param {Integer} _orders - array with order objects
 */
function formatFinanceOrders(_target, _orders)
{
    _target.empty();
    let _str = ''; let _date = '';
    
    for (let each in _orders)
    {(function(_idx, _arr)
        {
        let r_string ='';
        let _action = '<th><select id=f_action'+_idx+' onchange="changePromptFinanceCo('+_idx+');"><option value="NoAction">No Action</option>';
        //
        // each order can have different states and the action that a financier can take is directly dependent on the state of the order. 
        // this switch/case table displays selected order information based on its current status and displays selected actions, which
        // are limited by the sate of the order.
        //
        // Throughout this code, you will see many different objects referemced by 'textPrompts.orderProcess.(something)' 
        // These are the text strings which will be displayed in the browser and are retrieved from the prompts.json file 
        // associated with the language selected by the web user.
        //
        switch (JSON.parse(_arr[_idx].status).code)
        {
        case orderStatus.PayRequest.code:
            _date = _arr[_idx].paymentRequested;
            break;
        case orderStatus.Delivered.code:
            _date = _arr[_idx].delivered;
            break;
        case orderStatus.Dispute.code:
            _date = _arr[_idx].disputeOpened + '<br/>'+_arr[_idx].dispute;
            break;
        case orderStatus.Resolve.code:
            _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
            break;
        case orderStatus.Created.code:
            _date = _arr[_idx].created;
            break;
        case orderStatus.Cancelled.code:
            _date = _arr[_idx].cancelled;
            break;
        case orderStatus.Backordered.code:
            _date = _arr[_idx].dateBackordered + '<br/>'+_arr[_idx].backorder;
            break;
        case orderStatus.ShipRequest.code:
            _date = _arr[_idx].requestShipment;
            break;
        case orderStatus.Authorize.code:
            _date = _arr[_idx].approved;
            _action += '<option value="Pay">Accept Payment</option>';
            break;
        case orderStatus.Bought.code:
            _date = _arr[_idx].bought;
            break;
        case orderStatus.Delivering.code:
            _date = _arr[_idx].delivering;
            break;
        case orderStatus.Ordered.code: // now sets up request payment 
            _date = _arr[_idx].ordered;
            _action += '<option value="PayRequest">Request Payment</option>';
            break;
        case orderStatus.RefundRequested.code:
            _date = _arr[_idx].refundRequested;
            _action += '<option value="'+textPrompts.orderProcess.PayRefund.select+'">'+textPrompts.orderProcess.PayRefund.message+'</option>';
            r_string += '<br/><div id="f_RefundPrompt'+_idx+'">'+textPrompts.orderProcess.PayRefund.prompt+'<input id="f_amount_refund'+_idx+'" type="number" value="'+_arr[_idx].refAmtRequested+'"></input></div>';
            _action += '<option value="'+textPrompts.orderProcess.DenyRefund.select+'">'+textPrompts.orderProcess.DenyRefund.message+'</option>';
            r_string += '<br/><div id="f_RefundDenyPrompt'+_idx+'">'+textPrompts.orderProcess.DenyRefund.prompt+'<input id="f_reason_denyRefund'+_idx+'" type="text"></input></div>'
            break;
        case orderStatus.Paid.code:
            _date = _arr[_idx].paid;
            break;
        case orderStatus.Refunded.code:
            _date = _arr[_idx].orderRefunded;
            break;
        case orderStatus.Dropped.code:
            _date = _arr[_idx].dropped;
            break;
        default:
            break;
        }
        let _button = '<th><button id="f_btn_'+_idx+'">Execute</button></th>'
        _action += '</select>';
        if (_idx > 0) {_str += '<div class="spacer"></div>';}
        let _len = 'resource:org.acme.Z2BTestNetwork.Buyer#'.length;
        let _buyer = _arr[_idx].buyer.substring(_len, _arr[_idx].buyer.length);
        let remBal = _arr[_idx].amount - _arr[_idx].tuitionPaid;
        _str += '<div class="acc_header off" id="order'+_idx+'_h" target="order'+_idx+'_b"><table class="wide"><tr><th>Order #</th><th>Status</th><th class="right">Tuition</th><th id="rBalHead'+_idx+'" class="right">Remaing Balance</th><th colspan="3" class="right message">Student: '+findMember(_buyer,buyers).companyName+'</th></tr>';
        _str += '<tr><th id ="f_order'+_idx+'" class="showFocus">'+_arr[_idx].id+'</th><th id="f_status'+_idx+'">'+JSON.parse(_arr[_idx].status).text+'</th><th class="right">$'+_arr[_idx].amount+'.00<th id="rBalAmt'+_idx+'"class="right">$'+remBal+'.00</th></th>'+_action+r_string+'</th>'+_button+'</tr></table></div>';
        _str+= formatDetail(_idx, _arr[_idx]);
    })(each, _orders);
    }
    _target.append(_str);
    // Hide all input prompts initially.
    for (let each in _orders)
    {(function(_idx, _arr)
        {
            hidePromptsFinanceCo(_idx);
            // hide the remaining balance if needed
            let remBal = 0;
            let tmp_amt = _arr[_idx].amount;
            let tmp_paid = _arr[_idx].tuitionPaid;
            remBal = tmp_amt - tmp_paid;

            if (_arr[_idx].paymentRequested == '' || remBal == 0)
            {
                $('#rBalAmt'+_idx).hide();
                $('#rBalHead'+_idx).hide();
            }

        })(each, _orders);
    }

    for (let each in _orders)
        {(function(_idx, _arr)
        {
            $('#f_order'+_idx).on('click', function(){accToggle('financeCOorderDiv','order'+_idx+'_b', 'order'+_idx+'_h');});
            $('#order'+_idx+'_b').on('click', function(){accToggle('financeCOorderDiv','order'+_idx+'_b', 'order'+_idx+'_h');});
            $('#f_btn_'+_idx).on('click', function ()
            {
                let options = {};
                options.action = $('#f_action'+_idx).find(':selected').text();
                options.orderNo = $('#f_order'+_idx).text();
                options.participant = financeCoID;
                if ((options.action === 'Approve Refund') )
                {
                    //options.reason = $('#f_reason'+_idx).val();
                    options.tuitionRefunded = $('#f_amount_refund'+_idx).val();
                }
                if ((options.action === 'Deny Refund'))
                {
                    options.reason = $('#f_reason_denyRefund'+_idx).val();
                }
                $('#finance_messages').prepend(formatMessage('Processing '+options.action+' request for order number: '+options.orderNo));
                $.when($.post('/composer/client/orderAction', options)).done(function (_results)
                { console.log(_results);
                    $('#finance_messages').prepend(formatMessage(_results.result));
                });
            });
            if (notifyMe(f_alerts, _arr[_idx].id)) {$("#f_status"+_idx).addClass('highlight'); }
        })(each, _orders);
    }
    f_alerts = new Array();
    toggleAlert($('#financeCo_notify'), f_alerts, f_alerts.length);
}
/**
 * format the accordian with the details for this order
 * @param {Integer} _cur - offset into order array
 * @param {JSON} _order - JSON object with current order data
 * @returns {String} - html string to append to browser page
 */
function formatDetail(_cur, _order)
{
    console.log('['+_cur+'] is ',_order);
    let _out = '<div class="acc_body off" id="order'+_cur+'_b">';
    _out += '<h3 id="status">'+textPrompts.financeCoOrder.status+'\t'+JSON.parse(_order.status).text+'</h3>';
    _out += '<table class="wide"><tr><th id="action">'+textPrompts.financeCoOrder.status+'</th><th id="by">'+textPrompts.financeCoOrder.by+'</th><th id="date">'+textPrompts.financeCoOrder.date+'</th><th id="comments">'+textPrompts.financeCoOrder.comments+'</th></tr>';
    _out += '<tr><td id="created">Created</td><td>'+_order.buyer.split('#')[1]+'</td><td>'+_order.created+'</td><td></td></tr>';
    _out += (_order.bought === '') ?  '<tr><td id="purchased">'+textPrompts.financeCoOrder.purchased+'</td><td></td><td id="noPurchase">'+textPrompts.financeCoOrder.noPurchase+'</td><td></td></tr>' : '<tr><td id="purchased">'+textPrompts.financeCoOrder.purchased+'</td><td>'+_order.buyer.split('#')[1]+'</td><td>'+_order.bought+'</td><td></td></tr>';
    _out += (_order.ordered === '') ?  '<tr><td id="thirdParty">'+textPrompts.financeCoOrder.thirdParty+'</td><td></td><td id="nothirdParty">'+textPrompts.financeCoOrder.nothirdParty+'</td><td></td></tr>' : '<tr><td id="thirdParty">'+textPrompts.financeCoOrder.thirdParty+'</td><td>'+_order.seller.split('#')[1]+'</td><td>'+_order.ordered+'</td><td></td></tr>';
    _out += (_order.cancelled === '') ?  '<tr><td id="cancelled">'+textPrompts.financeCoOrder.cancelled+'?</td><td></td><td id="notCancel">'+textPrompts.financeCoOrder.notCancel+'</td><td></td></tr>' : '<tr><td id="cancelled">'+textPrompts.financeCoOrder.cancelled+'</td><td>'+_order.buyer.split('#')[1]+'</td><td>'+_order.cancelled+'</td><td>'+_order.cancel+'</td></tr>';
    _out += (_order.dropped === '') ? '<tr><td>Registration Dropped?</td><td></td><td>(Not Dropped)</td><td></td></tr>' : '<tr><td>Registration Dropped?</td><td>'+_order.financeCo.split('#')[1]+'</td><td>'+_order.dropped+'</td><td>'+_order.drop+'</td></tr>';
    _out += (_order.approved === '') ?  '<tr><td>Payment Approved</td><td></td><td>(No Approval from Buyer)</td><td></td></tr>' : '<tr><td>Payment Approved</td><td>'+_order.buyer.split('#')[1]+'</td><td>'+_order.approved+'</td><td></td></tr>';
    _out += (_order.denied === '') ? '<tr><td>Registration Denied?</td><td></td><td>(Not Denied)</td><td></td></tr>' : '<tr><td>Registration Denied?</td><td>'+_order.seller.split('#')[1]+'</td><td>'+_order.denied+'</td><td>'+_order.deny+'</td></tr>';
    _out += (_order.paymentRequested === '') ?  '<tr><td>'+textPrompts.financeCoOrder.payRequested+'</td><td></td><td id="noRequest">'+textPrompts.financeCoOrder.noRequest+'</td><td></td></tr>' : '<tr><td id="payRequested">'+textPrompts.financeCoOrder.payRequested+'</td><td>'+_order.financeCo.split('#')[1]+'</td><td>'+_order.paymentRequested+'</td><td></td></tr>';
    _out += (_order.lastPayment === '') ? '<tr><td>Payment made?</td><td></td><td>(No payment made)</td><td></td></tr>' : '<tr><td>"Payment made?</td><td>'+_order.buyer.split('#')[1]+'</td><td id="yesLastPaid">'+_order.lastPayment+'</td><td>Tuition Paid: $'+_order.tuitionPaid+'.00</td></tr>';
    _out += (_order.paid === '') ?  '<tr><td>Paid?</td><td></td><td>(UnPaid)</td><td></td></tr>' : '<tr><td>Paid</td><td>'+_order.financeCo.split('#')[1]+'</td><td>'+_order.paid+'</td><td>Paid in Full</td></tr>';
    _out += (_order.refundRequested === '') ?  '<tr><td id="RefundRequested">'+textPrompts.financeCoOrder.refundRequested+'</td><td></td><td id="noRefundRequested">'+textPrompts.financeCoOrder.noRefundRequested+'</td><td></td></tr>' : '<tr><td id="RefundRequested">'+textPrompts.financeCoOrder.refundRequested+'</td><td>'+_order.buyer.split('#')[1]+'</td><td>'+_order.refundRequested+'</td><td>'+_order.refundRequest+'</td></tr>';
    _out += (_order.refundDenied === '') ?  '<tr><td>Refund Denied?</td><td></td><td>(Refund not Denied)</td><td></td></tr>' : '<tr><td>Refund Denied?</td><td>'+_order.financeCo.split('#')[1]+'</td><td>'+_order.refundDenied+'</td><td>'+_order.refundDeny+'</td></tr>';
    _out += (_order.orderRefunded === '') ?  '<tr><td>Refunded?</td><td></td><td>(Not Yet Refunded)</td><td></td></tr>' : '<tr><td>Refund?</td><td>'+_order.financeCo.split('#')[1]+'</td><td>'+_order.orderRefunded+'</td><td> Amount Refunded: $'+_order.tuitionRefunded+'.00</td></tr>';
    _out += '</table></div>';
    return _out;
}


function changePromptFinanceCo(_index) {
    hidePromptsFinanceCo(_index);
    console.log("in change Prompt");
    let _tmp = '#f_action' + _index;
    console.log("#f_action (_tmp): "+_tmp);
    let _val = $(_tmp).find(':selected').text();
    console.log("_val: "+_val);
    switch (_val)
    {
        case 'Approve Refund':
            console.log("in the approve");
            $('#f_RefundPrompt'+_index).show();
            break;
        case 'Deny Refund':
            $('#f_RefundDenyPrompt'+_index).show();
            break;
        default:
            break;
    }
}

/**
 * Hides all of the input prompts
 * @param {Index} _index - index of the current order
 */
function hidePromptsFinanceCo(_idx) {
    $('#f_PayPrompt'+_idx).hide();
    $('#f_RefundPrompt'+_idx).hide();
    $('#f_DenyPrompt'+_idx).hide();
    $('#f_RefundDenyPrompt'+_idx).hide();   
}