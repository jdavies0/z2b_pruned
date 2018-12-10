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

// z2c-buyer.js

'use strict';
let b_notify = '#buyer_notify';
let b_count = '#buyer_count';
let b_id = '';
let b_alerts;
let b_resident = 0;

let orderDiv = 'orderDiv';
let itemTable = {};
let newItems = [];
let totalAmount = 0;
let courseCost = 0;
//<li id="US_English"><a onclick="goMultiLingual('US_English', 'index')">US English</a></li>

let active_user;
let inActiveOrders = 0;


/**
 * load the Buyer User Experience
 */
function loadBuyerUX (nested)
{
    currentPage = 'buyer.html';
    // get the html page to load
    console.log ("in LoadBuyerUX");

    var tag ='#body';
    if (nested)
        tag = '#buyerbody';

    let toLoad = 'buyer_login.html';

    $.when($.get(toLoad)).done(function (page, res)
    {
     
        // empty the html element that will hold this page
        $(tag).empty();
        $(tag).append(page);

        updatePage('buyer_login');
        updatePage('skins');

        let _list = $('#orderStatus');
        $('#students').hide();
        console.log ("domain: "+$('#school_domain').text());
        displayRegisteredStudents($("#school_domain").text(), buyers);

        $('.hint').on('click', function()
        {
            if ($('#students').is(':visible'))
                $('#students').hide();
            else
                $('#students').show();
        });

        let _login = $('#loginButton');
        _login.on('click', function()
        { 
            //var _username =  document.getElementById("username").value;
            let _username =  document.getElementById("username").value;
        console.log("_username: " + _username);
            if ((typeof(_username) === 'undefined') || (_username === null)|| (_username === "") )
            {
                switch (textPrompts.skins_l.school_domain)
                {
                    case 'ncsu.edu':
                        _username = "jdavies@ncsu.edu";
                        break;
                    case 'durhamtech.edu':
                        _username = "joshuamoore@durhamtech.edu";
                        break;
                    case 'duke.edu':
                        _username = "peterchen@duke.edu";
                        break;
                    case 'unc.edu':
                        _username = "deborahmiller@unc.edu";
                        break;
                    case 'ecu.edu':
                        _username = "jeffjones@ecu.edu";
                        break;
                    case 'waketech.edu':
                        _username = "adrodrigues@my.waketech.edu";
                        break;
                    default:
                        console.log("no school domain");
                        break;
                }
                console.log('setting default username to '+_username);
            }
//            loadLoggedinBuyerUX(nested, _username);

           if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(_username))
            {
                let u =  findMember(_username,buyers);
                let _userDomain = u.id.split('@')[1];

                if ((typeof(u) === 'undefined') || (u === null) || (u.length === 0) || (u.companyName == 'not found'))
                {
                    if ( (_userDomain != textPrompts.skins_l.school_domain) || (_userDomain != 'my.waketech.edu') )
                    alert("The information entered does not match a registered student in our system.\nPlease check and try again.")
                }
                else
                {
                    $('#students').hide();
                    loadLoggedinBuyerUX(nested, _username);
                }
            }
            else
            {
                alert("You have entered an invalid email address!")
            }
        });
    });
}

function loadLoggedinBuyerUX (nested, username)
{
    // get the html page to load
    console.log ("in loadLoggedinBuyerUX username="+username);
    let toLoad = 'buyer.html';
    // if (buyers.length === 0) then autoLoad() was not successfully run before this web app starts, so the sie of the buyer list is zero
    // assume user has run autoLoad and rebuild member list
    // if autoLoad not yet run, then member list length will still be zero
/*    if ((typeof(buyers) === 'undefined') || (buyers === null) || (buyers.length === 0))
    { $.when($.get(toLoad), deferredMemberLoad()).done(function (page, res)
        {setupBuyer(page,nested);});
        }
        else{
            $.when($.get(toLoad)).done(function (page)
            {setupBuyer(page,nested);});
    }
*/

    if ((typeof(buyers) === 'undefined') || (buyers === null) || (buyers.legth === 0) )
    { $.when($.get(toLoad), deferredMemberLoad()).done(function (page, res)
        {setupBuyer(page,nested, username);});
    }
    else
    {
            $.when($.get(toLoad)).done(function (page)
            {setupBuyer(page,nested,username);});
    }
}

/**
* @param int nested - flag if page nested in table
 */

function setupBuyer(page, nested, username)
{
    let options = {};

    console.log ("setup buyer")
    var tag ='#body';
    if (nested)
        tag = '#buyerbody';

    // empty the html element that will hold this page
    $(tag).empty();
    $(tag).append(page);
    // empty the buyer alerts array
    b_alerts = [];
    // if there are no alerts, then remove the 'on' class and add the 'off' class
    if (b_alerts.length === 0)
    {$(b_notify).removeClass('on'); $(b_notify).addClass('off'); }
    else {$(b_notify).removeClass('off'); $(b_notify).addClass('on'); }
      // update the text on the page using the prompt data for the selected language
    updatePage('buyer');
    // enable the buttons to process an onClick event
    let _create = $('#newOrder');
    let _list = $('#orderStatus');
    let _orderDiv = $('#'+orderDiv);

    _create.on('click', function(){console.log("got click: New Order 1"); displayOrderForm();});
//    _list.on('click', function(){listOrders();});

    _list.on('click', function(){ console.log("got click: List Order"); listOrdersByBuyerID(buyer.id);});
    $('#buyer').empty();
    $('#orderStatus').hide();
    $('#newOrder').hide();
    // build the buer select HTML element
    // Removed so as to use the login page
   //for (let each in buyers)
    //{(function(_idx, _arr)
      //  {$('#buyer').append('<option value="'+_arr[_idx].id+'">' +_arr[_idx].id+'</option>');})(each, buyers);
    //}
    document.getElementById('buyer').value = username;
    let buyer=  findMember(username,buyers);
    // save the current buyer id as b_id
    b_id = buyer.id;
    // save the current buyer id as b_resident
    b_resident = buyer.resident;

    // display the name of the current buyer
    $('#company')[0].innerText =     buyer.companyName; 
    // subscribe to events
    z2bSubscribe('Buyer', b_id);
    listOrdersByBuyerID (b_id);
}

/**
 * Displays the create order form for the selected buyer
 */
function displayOrderForm()
{  let toLoad = 'createOrder.html';
    totalAmount = 0;
    newItems = [];
    let selTmp = 'registrar@'+textPrompts.skins_l.school_domain;
    // get the order creation web page and also get all of the items that a user can select
    $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
    {
        itemTable = _items[0].items;
        let _orderDiv = $('#'+orderDiv);
        _orderDiv.empty();
        _orderDiv.append(page[0]);
        // update the page with the appropriate text for the selected language
        updatePage('createOrder');
        $('#seller').empty();
        $('#selectVendor').empty();
        // populate the seller HTML select object. This string was built during the memberLoad or deferredMemberLoad function call
        //$('#seller').append(s_string);
        //$('#seller').val($('#seller option:first').val());
        //console.log('selTmp '+selTmp);
        document.getElementById("seller").value = selTmp;
        $('#selectVendor').append('School: '+textPrompts.skins_l.school_shortName);
        $('#orderNo').append('xxx');
        $('#status').append('New Order');
        $('#today').append(new Date().toISOString());
        $('#amount').append('$'+totalAmount+'.00');
        // build a select list for the items
        let _str = '';
        for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].courseDescription+'</option>';})(each, itemTable);}
        $('#items').empty();
        $('#items').append(_str);
        $('#cancelNewOrder').on('click', function (){_orderDiv.empty();});
        // hide the submit new order function until an item has been selected
        $('#submitNewOrder').hide();
        $('#submitNewOrder').on('click', function ()
            { let options = {};
            //options.buyer = $('#buyer').find(':selected').val();
            options.buyer = document.getElementById("buyer").value;
            //options.seller = $('#seller').find(':selected').val();
            options.seller = document.getElementById("seller").value;
            options.items = newItems;
            console.log(options);
            _orderDiv.empty(); _orderDiv.append(formatMessage(textPrompts.orderProcess.create_msg));
            $.when($.post('/composer/client/addOrder', options)).done(function(_res)
            {
                _orderDiv.empty(); _orderDiv.append(formatMessage(_res.result)); console.log(_res);
                $('#orderStatus').show();
            
            });
        });
        // function to call when an item has been selected
        $('#addItem').on('click', function ()
        { let _ptr = $('#items').find(':selected').val();
            // remove the just selected item so that it cannot be added twice.
            $('#items').find(':selected').remove();
            // build a new item detail row in the display window
            let _item = itemTable[_ptr];
            let len = newItems.length;
            _str = '<tr><td>'+_item.courseDept+"."+_item.courseID+"."+_item.courseSection+'</td><td>'+_item.courseDescription+'</td><td id="count'+len+'"></td><td id="price'+len+'"></td></tr>';
            $('#itemTable').append(_str);
            // set the initial item count to 1
            $('#count'+len).val(1);
            // set the initial price to the price of one item
            
            if (b_resident == 1)
            {
                courseCost = 76*_item.creditHours;
                
                //courseCost = $('#residentCreditCost')*_item.creditHours;
            }
            else
            {
                courseCost=268*_item.creditHours;
                //courseCost=$('#nonResidentCreditCost')*_item.creditHours;
            }
            
            console.log("credit cost: $"+courseCost);

            $('#price'+len).append('$'+courseCost); // $76 (resident) 268 (non-resident)
            // add an entry into an array for this newly added item
            let _newItem = _item;
            _newItem.extendedPrice = courseCost;
            newItems[len] = _newItem;
            newItems[len].quantity=1;
            totalAmount += _newItem.extendedPrice;
            // update the order amount with this new item
            $('#amount').empty();
            $('#amount').append('$'+totalAmount+'.00');
            // function to update item detail row and total amount if itemm count is changed
/*            $('#count'+len).on('change', function ()
            {let len = this.id.substring(5);
                let qty = $('#count'+len).val();
                let price = newItems[len].unitPrice*qty;
                let delta = price - newItems[len].extendedPrice;
                totalAmount += delta;
                $('#amount').empty();
                $('#amount').append('$'+totalAmount+'.00');
                newItems[len].extendedPrice = price;
                newItems[len].quantity=qty;
                $('#price'+len).empty(); $('#price'+len).append('$'+price+'.00');
            });
*/
            $('#submitNewOrder').show();
        });
    });
}

/**
 * lists all orders for the selected buyer
 */
function listOrdersByBuyerID(b_id)
{
    let options = {};
    // get the users email address
    options.id = b_id;
    // get their password from the server. This is clearly not something we would do in production, but enables us to demo more easily
    // $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
    // {
    // get their orders
    options.userID = options.id;
    // options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
    {
        if ((typeof(_results.orders) === 'undefined') || (_results.orders === null))
        {console.log('error getting orders: ', _results);}
        else
        {
            // if they have no orders, then display a message to that effect
            if (_results.orders.length < 1) 
            {
                $('#orderDiv').empty(); 
                $('#orderDiv').append(formatMessage(textPrompts.orderProcess.b_no_order_msg+options.id));
                $('#orderStatus').hide();
                $('#newOrder').show();
                formatOrders($('#orderDiv'), _results.orders);
               // _create = $('#updateOrder');
                //_create.on('click', function(){console.log("got click: Update Order");displayModifyOrderForm();});
            }
        // if they have orders, format and display the orders.
            else
            {
                // if the user has orders, check to see if there is at least 1 active order
                if (_results.orders.length > 0)
                {
                    // check for active orders
                    if(findActiveOrders(_results.orders))
                    {
                        console.log("Found an active order");
                        formatOrders($('#orderDiv'), _results.orders);
                        $('#newOrder').hide();
                        $('#orderStatus').show();
                    }
                    else // no active orders
                    {
                        $('#newOrder').show();
                        $('#orderStatus').hide();
                        formatOrders($('#orderDiv'), _results.orders);
                    }
                }  
            }
        }
    });
}

/**
 * 
 * @param {orders} _orders - inbound orders
 */
function findActiveOrders(_orders)
{
    let activeOrder = true;
    for (let each in _orders)
    {(function(_idx, _arr)
        {
            if ( (_arr[_idx].cancelled != '') || (_arr[_idx].dropped != '') )
                {
                    if ( _arr[_idx].tuitionPaid == _arr[_idx].tuitionRefunded )
                    {
                        activeOrder = false;
                    }
                }
        })(each, _orders);
    }
    return activeOrder;
}

/**
 * used by the listOrders() function
 * formats the orders for a buyer. Orders to be formatted are provided in the _orders array
 * output replaces the current contents of the html element identified by _target
 * @param {String} _target - string with div id prefaced by #
 * @param {Array} _orders - array with order objects
 */
function formatOrders(_target, _orders)
{
    inActiveOrders = 0;
    _target.empty();
    let _str = ''; let _date = '';
    for (let each in _orders)
    {(function(_idx, _arr)
      {
        let active_tag = 'activeOrder';

        if ( (_arr[_idx].cancelled != '') || (_arr[_idx].dropped != '') ) {
            if ( _arr[_idx].tuitionPaid == _arr[_idx].tuitionRefunded )
            {
                active_tag = 'nonActiveOrder';
                inActiveOrders++;
            }
        }

        _str += '<div id="b_orderType'+_idx+'" class="'+active_tag+'">';
        let r_string;
        r_string = '</th>';

        let _action = '<th><select id=b_action'+_idx+' onchange="changePrompt('+_idx+');"><option value="'+textPrompts.orderProcess.NoAction.select+'">'+textPrompts.orderProcess.NoAction.message+'</option>';
        //
        // each order can have different states and the action that a buyer can take is directly dependent on the state of the order.
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
            _action += '<option value="'+textPrompts.orderProcess.AuthorizePayment.select+'">'+textPrompts.orderProcess.AuthorizePayment.message+'</option>';
            r_string = '<br/><div id="PayPrompt'+_idx+'">'+textPrompts.orderProcess.AuthorizePayment.prompt+'<input id="b_reason'+_idx+'" type="number"></input></div>';
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string += '<div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></div></th>';
            break;
        case orderStatus.Delivered.code:
            _date = _arr[_idx].delivered;
            _action += '<option value="'+textPrompts.orderProcess.Dispute.select+'">'+textPrompts.orderProcess.Dispute.message+'</option>';
            r_string = '<br/><div id="DisputePrompt'+_in_idxdex+'">'+textPrompts.orderProcess.Dispute.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Dispute.code:
            _date = _arr[_idx].disputeOpened + '<br/>'+_arr[_idx].dispute;
            _action += '<option value="'+textPrompts.orderProcess.Resolve.select+'">'+textPrompts.orderProcess.Resolve.message+'</option>';
            r_string = '<br/><div id="DisputePrompt'+_idx+'">'+textPrompts.orderProcess.Dispute.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Resolve.code:
            _date = _arr[_idx].disputeResolved + '<br/>'+_arr[_idx].resolve;
            _action += '<option value="'+textPrompts.orderProcess.AuthorizePayment.select+'">'+textPrompts.orderProcess.AuthorizePayment.message+'</option>';
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>';
            r_string = '<br/><div id="CancelPrompt'+_idx+'">'+textPrompts.orderProcess.Cancel.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Created.code:
            _date = _arr[_idx].created;
            _action += '<option value="'+textPrompts.orderProcess.Purchase.select+'">'+textPrompts.orderProcess.Purchase.message+'</option>'
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>';
            r_string = '<br/><div id="CancelPrompt'+_idx+'">'+textPrompts.orderProcess.Cancel.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Denied.code:
            _date = _arr[_idx].denied + '<br/>Reason: '+_arr[_idx].deny;
            _action += '<option value="'+textPrompts.orderProcess.Purchase.select+'">'+textPrompts.orderProcess.Purchase.message+'</option>'
            _action += '<option value="'+textPrompts.orderProcess.Cancel.select+'">'+textPrompts.orderProcess.Cancel.message+'</option>';
            r_string = '<br/><div id="CancelPrompt'+_idx+'">'+textPrompts.orderProcess.Cancel.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Backordered.code:
            _date = _arr[_idx].dateBackordered + '<br/>'+_arr[_idx].backorder;
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string = '<br/><div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.ShipRequest.code:
            _date = _arr[_idx].requestShipment;
            break;
        case orderStatus.Authorize.code:
            _date = _arr[_idx].approved;
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string = '<br/><div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Bought.code:
            _date = _arr[_idx].bought;
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string = '<br/><div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Delivering.code:
            _date = _arr[_idx].delivering;
            break;
        case orderStatus.Ordered.code:
            _date = _arr[_idx].ordered;
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string = '<br/><div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.Cancelled.code:
            _date = _arr[_idx].cancelled;
            if (_arr[_idx].paid != '') {
                _action += '<option value="RequestRefund">Request Refund</option>';
                r_string = '<br/><div id="RefundPrompt'+_idx+'">'+textPrompts.orderProcess.Refund.prompt+'<input id="b_reason'+_idx+'" type="text"></input><br/><input id="b_amount'+_idx+'" type="number" value="'+_arr[_idx].tuitionPaid+'"></input></th></div>';
            }
            break;
        case orderStatus.Paid.code:
            _date = _arr[_idx].paid;
            _action += '<option value="'+textPrompts.orderProcess.Drop.select+'">'+textPrompts.orderProcess.Drop.message+'</option>';
            r_string = '<br/><div id="DropPrompt'+_idx+'">'+textPrompts.orderProcess.Drop.prompt+'<input id="b_reason'+_idx+'" type="text"></input></th></div>';
            break;
        case orderStatus.RefundRequested.code:
            _date = _arr[_idx].refundRequested;
            break;
        case orderStatus.Refunded.code:
            _date = _arr[_idx].orderRefunded;
            break;
        case orderStatus.Dropped.code:
            _date = _arr[_idx].dropped;
            // if the order has been at least partially paid, refund can be requested.
            if ((_arr[_idx].lastPayment != '') || (_arr[_idx].paid != '')) {
                _action += '<option value="RequestRefund'+_idx+'">Request Refund</option>';
                r_string = '<br/><div id="RefundPrompt'+_idx+'">'+textPrompts.orderProcess.Refund.prompt+'<input id="b_reason'+_idx+'" type="text"></input><br/>Amount Requested: <br/><input id="b_amount'+_idx+'" type="number" value="'+_arr[_idx].tuitionPaid+'"></input></th></div>';
            }
            break;
        case orderStatus.RefundDenied.code:
            _date = _arr[_idx].refundDenied;
            _action += '<option value="RequestRefund'+_idx+'">Request Refund</option>';
            r_string = '<br/><div id="RefundPrompt'+_idx+'">'+textPrompts.orderProcess.Refund.prompt+'<input id="b_reason'+_idx+'" type="text"></input><br/>Amount Requested: <br/><input id="b_amount'+_idx+'" type="number" value="'+_arr[_idx].tuitionPaid+'"></input></th></div>';
            break;
        case orderStatus.Partial.code:
            _date = _arr[_idx].lastPayment + '<br/>Paid: ' + _arr[_idx].tuitionPaid
            + '<br/>Remaining Balance: ' + (_arr[_idx].amount - _arr[_idx].tuitionPaid);
            _action += '<option value="'+textPrompts.orderProcess.AuthorizePayment.select+'">'+textPrompts.orderProcess.AuthorizePayment.message+'</option>';
            r_string = '<br/><div id="PayPrompt'+_idx+'">'+textPrompts.orderProcess.AuthorizePayment.prompt+'<input id="b_reason'+_idx+'" type="number"></input></th></div>';
            break;
        default:
            break;
        }
        let _button = '<th><button id="b_btn_'+_idx+'">'+textPrompts.orderProcess.ex_button+'</button></th>';
        _action += '</select>';
        
        _str += '<table class="wide"><tr><th>'+textPrompts.orderProcess.orderno+'</th><th>'+textPrompts.orderProcess.status+'</th><th class="right">'+textPrompts.orderProcess.total+'</th><th colspan="3" class="right message">'+textPrompts.orderProcess.seller+findMember(_arr[_idx].seller.split('#')[1],sellers).companyName+'</th></tr>';
        _str += '<tr id="no_r_String"><th id ="b_order'+_idx+'" width="20%">'+_arr[_idx].id+'</th><th width="50%" id="b_status'+_idx+'">'+JSON.parse(_arr[_idx].status).text+': '+_date+'</th><th class="right">$'+_arr[_idx].amount+'.00</th>'+_action+r_string+_button+'</tr></table>';
        _str+= '<table class="wide"><tr align="center"><th>'+textPrompts.orderProcess.itemno+'</th><th>'+textPrompts.orderProcess.description+'</th><th>'+textPrompts.orderProcess.qty+'</th><th>'+textPrompts.orderProcess.price+'</th></tr>'
        for (let every in _arr[_idx].items)
        {
            (function(_idx2, _arr2)
                { let _item = JSON.parse(_arr2[_idx2]);
//                    _str += '<tr><td align="center" width="20%">'+_item.itemNo+'</td><td width="50%">'+_item.description+'</td><td align="center">'+_item.quantity+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>'; 
// edit here - html for displaying a course
            _str += '<tr><td align="center" width="20%">'+_item.courseDept+"-"+_item.courseID+'</td><td width="50%">'+_item.courseDescription+'</td><td align="center">'+_item.creditHours+'</td><td align="right">$'+_item.extendedPrice+'.00</td><tr>';
                })(every, _arr[_idx].items);
        }
        _str += '</table>';
        // insert spacer 
        if (_idx == 0 || _idx < _arr.length -1 ) {
            _str += '<div id="spacer'+_idx+'" class="spacer"></div>';
        }
        _str += '</div>';

    })(each, _orders);
    }
    // append the newly built order table to the web page
    _target.append(_str);
    
    if(_orders.length == inActiveOrders)
        document.getElementById('b_DisplayPreference').selectedIndex  = 1;

    changeBuyerView();
    for (let each in _orders)
    {(function(_idx)
        {
            hidePrompts(_idx);
        })(each, _orders);
    }
    //
    // now that the page has been placed into the browser, all of the id tags created in the previous routine can now be referenced.
    // iterate through the page and make all of the different parts of the page active.
    //
    for (let each in _orders)
        {
            (function(_idx, _arr)
            { $('#b_btn_'+_idx).on('click', function ()
                {
                let options = {};
                options.action = $('#b_action'+_idx).find(':selected').text();
                options.orderNo = $('#b_order'+_idx).text();
                options.participant = $('#buyer').val();
                if ((options.action === 'Dispute') || (options.action === 'Resolve') 
                 || (options.action === 'Drop Schedule') || (options.action === 'Cancel Schedule')
                 || (options.action === 'Pay Tuition') )
                {
                    options.reason = $('#b_reason'+_idx).val();
                }
                if ( options.action === 'Pay Tuition' ) {
                    if ( (parseInt(options.reason) + _arr[_idx].tuitionPaid ) > _arr[_idx].amount)
                    {
                        alert("Your payment would exceed your total tuition amount, please enter a different amount");
                        return;
                    }
                }
                if ( (options.action === 'Refund') || (options.action === 'Request Refund') ) {
                    options.reason = $('#b_reason'+_idx).val();
                    options.refAmtRequested = $('#b_amount'+_idx).val();
                }
                $('#buyer_messages').prepend(formatMessage(options.action+textPrompts.orderProcess.processing_msg.format(options.action, options.orderNo)+options.orderNo));
                $.when($.post('/composer/client/orderAction', options)).done(function (_results)
                { $('#buyer_messages').prepend(formatMessage(_results.result)); });
            });
            // use the notifyMe function to determine if this order is in the alert array. 
            // if it is, the highlight the $('#b_status'+_idx) html element by adding the 'highlight' class
            if (notifyMe(b_alerts, _arr[_idx].id)) {$('#b_status'+_idx).addClass('highlight'); }
        })(each, _orders);
    }
    // reset the b_alerts array to a new array
    b_alerts = new Array();
    // call the toggleAlerts function to reset the alert icon
    toggleAlert($('#buyer_notify'), b_alerts, b_alerts.length);
}


function changePrompt(_index) {
    hidePrompts(_index);
    let _tmp = '#b_action' + _index;
    let _val = $(_tmp).find(':selected').text();
    switch (_val)
    {
        case 'Request Refund':
            $('#RefundPrompt'+_index).show();        
            break;
        case 'Pay Tuition':
            $('#PayPrompt'+_index).show();        
            break;
        case 'Cancel Schedule':
            $('#CancelPrompt'+_index).show();    
            break;
        case 'Drop Schedule':
            $('#DropPrompt'+_index).show();    
            break;
        case 'Deny Registration':
            // Seller only
            break;
        default:
            break;
    }
}

function hidePrompts(_idx) {
    $('#PayPrompt'+_idx).hide();
    $('#DisputePrompt'+_idx).hide();
    $('#ResolvePrompt'+_idx).hide();
    $('#CancelPrompt'+_idx).hide();
    $('#DropPrompt'+_idx).hide();
    $('#RefundPrompt'+_idx).hide();
}

/**
 * Hide or show non-active orders
 * Non-active orders are those that are:
 *  (dropped || canceled) && 
 *  refunded amount == paid tuition amount)
 * non-active orders have tag set for nonActiveOrder
 */

function changeBuyerView(){
    if (inActiveOrders == 0)
        return;
        
    // get the value of the selection
    let _val = $('#b_DisplayPreference').val();
    switch (_val)
    {
        case 'ActiveOnly':
            //$('#nonActiveOrder').hide();
            $(".nonActiveOrder").addClass("hide");
            $(".nonActiveOrder").removeClass("show");
            break;
        case 'ShowAll':
            //$('#nonActiveOrder').show();
            $(".nonActiveOrder").addClass("show");
            $(".nonActiveOrder").removeClass("hide");
            break;
    }
}









/***********************************************************************************************
Defunct stuff 
*************************************************************************************************/
/**
 * Displays the create order form for the selected buyer
 */
/* function displayModifyOrderForm()
{  let toLoad = 'modifyOrder.html';
    totalAmount = 0;
    newItems = [];
    // get the order creation web page and also get all of the items that a user can select
    $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
    {
        itemTable = _items[0].items;
        let _orderDiv = $('#'+orderDiv);
        _orderDiv.empty();
        _orderDiv.append(page[0]);
        // update the page with the appropriate text for the selected language
        updatePage('modifyOrder');
        $('#seller').empty();
        // populate the seller HTML select object. This string was built during the memberLoad or deferredMemberLoad function call
        $('#seller').append(s_string);
        $('#seller').val($('#seller option:first').val());
        $('#orderNo').append('xxx');
        $('#status').append('Modify Order');
        $('#today').append(new Date().toISOString());
        $('#amount').append('$'+totalAmount+'.00');
        // build a select list for the items
        let _str = '';
        for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].courseDescription+'</option>';})(each, itemTable);}
        $('#items').empty();
        $('#items').append(_str);
        $('#cancelNewOrder').on('click', function (){_orderDiv.empty();});
        // hide the submit new order function until an item has been selected
        $('#submitNewOrder').hide();
        $('#submitNewOrder').on('click', function ()
            { let options = {};
            //options.buyer = $('#buyer').find(':selected').val();
            options.buyer = document.getElementById("buyer").value;
console.log("line 398: options.buyer; "+options.buyer);
            options.seller = $('#seller').find(':selected').val();
            options.items = newItems;
            console.log(options);
            _orderDiv.empty(); _orderDiv.append(formatMessage(textPrompts.orderProcess.create_msg));
            $.when($.post('/composer/client/addOrder', options)).done(function(_res)
            {    _orderDiv.empty(); _orderDiv.append(formatMessage(_res.result)); console.log(_res);});
        });
        // function to call when an item has been selected
        $('#addItem').on('click', function ()
        { let _ptr = $('#items').find(':selected').val();
            // remove the just selected item so that it cannot be added twice.
            $('#items').find(':selected').remove();
            // build a new item detail row in the display window
            let _item = itemTable[_ptr];
            let len = newItems.length;
            _str = '<tr><td>'+_item.courseDept+"."+_item.courseID+"."+_item.courseSection+'</td><td>'+_item.courseDescription+'</td><td id="count'+len+'"></td><td id="price'+len+'"></td></tr>';
            $('#itemTable').append(_str);
            // set the initial item count to 1
            $('#count'+len).val(1);
            // set the initial price to the price of one item
        console.log('_item.creditHours: '+_item.creditHours);
            if (b_resident === 1)
                courseCost = 76*_item.creditHours;
            else
                courseCost=268*_item.creditHours;

            $('#price'+len).append('$'+courseCost); // $76 (resident) 268 (non-resident)
            // add an entry into an array for this newly added item
            let _newItem = _item;
            _newItem.extendedPrice = courseCost;
            newItems[len] = _newItem;
            newItems[len].quantity=1;
            totalAmount += _newItem.extendedPrice;
            // update the order amount with this new item
            $('#amount').empty();
            $('#amount').append('$'+totalAmount+'.00');
            // function to update item detail row and total amount if itemm count is changed
/*           $('#count'+len).on('change', function ()
            {let len = this.id.substring(5);
                let qty = $('#count'+len).val();
                let price = newItems[len].unitPrice*qty;
                let delta = price - newItems[len].extendedPrice;
                totalAmount += delta;
                $('#amount').empty();
                $('#amount').append('$'+totalAmount+'.00');
                newItems[len].extendedPrice = price;
                newItems[len].quantity=qty;
                $('#price'+len).empty(); $('#price'+len).append('$'+price+'.00');
            });
*/
      //      $('#submitNewOrder').show();
    //    });
  //  });
//}


///**
// * 
// * @param {*} buyer_id 
// */
/*function getBuyerScheduleCount (b_id)
{
    let _count = 0;
    let options = {};


    // get the users email address
    options.id = b_id;
    // get their password from the server. This is clearly not something we would do in production, but enables us to demo more easily
    // $.when($.post('/composer/admin/getSecret', options)).done(function(_mem)
    // {
    // get their orders
    options.userID = b_id;
    // options.userID = _mem.userID; options.secret = _mem.secret;
    $.when($.post('/composer/client/getMyOrders', options)).done(function(_results)
    {
        if ((typeof(_results.orders) === 'undefined') || (_results.orders === null))
        {console.log('error getting orders: ', _results);}
        else
        {_count = _results.orders.length;}
    });

 
//    Error: Participant 'org.acme.Z2BTestNetwork.Buyer#adrodrigues@my.waketech.edu' does not have 'READ' access to resource 'org.acme.Z2BTestNetwork.Order#004' 

//    if (_scheduleCount > 0 )
  //      $('#orderStatus').show();
  //  else
 //       $('#orderStatus').hide();
//
    return _count;
}
*/

// From in setupBuyer()
/*    // create a function to execute when the user selects a different buyer
    $('#buyer').on('change', function() 
    { _orderDiv.empty(); $('#buyer_messages').empty(); 
        $('#company')[0].innerText = findMember($('#buyer').find(':selected').text(),buyers).companyName; 
        // unsubscribe the current buyer
        z2bUnSubscribe(b_id);

        // edit here
        // get the new buyer id
        b_id = findMember($('#buyer').find(':selected').text(),buyers).id;
        b_resident = findMember($('#buyer').find(':selected').text(),buyers).resident; // edit here
//        console.log ("New Student: "+findMember($('#buyer').find(':selected').text(),buyers).id + "residency: "+findMember($('#buyer').find(':selected').text(),buyers).resident);
        scheduleCount = getBuyerScheduleCount (b_id); // edit here
        console.log ("schedule count = "+scheduleCount);
        if (scheduleCount > 0) 
        { 
            listOrders();
            _create = $('#updateOrder');
            _create.on('click', function(){displayModifyOrderForm();});
        }
        else
        {
            _create = $('#newOrder');
            _create.on('click', function(){displayOrderForm();});
        }
    

        // subscribe the new buyer
        z2bSubscribe('Buyer', b_id);
    });
*/