const express = require('express');
var cors = require('cors');

const app = express();
app.use(cors());

const debug = require('debug')('myapp:server');
const PORT = process.env.PORT || 8080;

const request = require('request');
const { json } = require('express');

function make_request(url)
{
	return new Promise((resolve, reject) => {
        request(url, {json:true}, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

function createfilter(count, filterName, filterValue, param) {
	if(param)
		return "&itemFilter(" + count + ").paramName=" + filterName + "&itemFilter(" + count + ").paramValue=" + filterValue;
	else 
	    return "&itemFilter(" + count + ").name=" + filterName + "&itemFilter(" + count + ").value=" + filterValue;
}

app.get('/getitem', async function (req, res, next)
{
    var itemid = req.query.itemid;      //itemid
    var url = "http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=NaureenF-CS571Web-PRD-92eba3d7e-ea9abf29&siteid=0&version=967&ItemID=" + itemid + "&IncludeSelector=Description,Details,ItemSpecifics";
    console.log(url);
    body = await make_request(url);
    if(body['Ack'] == "Success") {
          res.status(200).json({'status' : 'ok', 'payload' : body['Item'], 'message': "Successful : Item Data Found"})
    }
    else {
          res.status(200).json({'status' : 'ok',  'message': "Successful : No Data Found"})
    }
})

app.get('/search', async function (req, res, next)
	{
        var keywords = req.query.keywords;      //keywords
        var min_price = req.query.min_price;    //min_price
        var max_price = req.query.max_price;    //max_price
        var condition1 = req.query.new;         //condition1
        var condition2 = req.query.used;        //condition2
        var condition3 = req.query.unspecified; //condition3
        var sortorder = req.query.SortOrder;    //sortOrder

        /*
        const sort_array = ["BestMatch","CurrentPriceHighest","PricePlusShippingHighest","PricePlusShippingLowest"];
        if (sortorder = "Best Match"){
            var sortvalue = sort_array[0];      
        }
        else if(sortorder = "Price : highest first") {
          var sortvalue = sort_array[1];      
        }
        else if(sortorder = "Price + Shipping : lowest first") {
          var sortvalue = sort_array[2];      
        }
        else if(sortorder = "Price + Shipping : highest first") {
          var sortvalue = sort_array[3];      
        }*/

        var url = "https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=NaureenF-CS571Web-PRD-92eba3d7e-ea9abf29&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD";
        url += "&keywords=" + keywords;   
        url += "&sortOrder=" + sortorder;

        var count=0;
        if(min_price != undefined && min_price != "null" ) {
          url += createfilter(count, "MinPrice", min_price, false);
          url += createfilter(count, "Currency", "USD", true);
          count++;
        }
        if(max_price != undefined && max_price != "null" ) {
          url += createfilter(count, "MaxPrice", max_price, false);
          url += createfilter(count, "Currency", "USD", true);
          count++;
        }

        console.log(condition1);
        console.log(condition2);
        console.log(condition3);
        if(condition1 == true || condition2 == true || condition3 == true ) {
          url += "&itemFilter(" + count + ").name=" + "Condition";
          var value_count= 0;
          var cond        = [condition1, condition2, condition3];
          var cond_values = ["New", "Used", "Unspecified"];
          var i;
          for(i=0;i<cond_values.length;i++) {
            if(cond[i] == 'true') {
              url += "&itemFilter(" + count + ").value(" + value_count + ")=" + cond_values[i];
              value_count++;
            }
          }
        } 
        console.log(url);
        body = await make_request(url);
        var findItemsAdvanced = body['findItemsAdvancedResponse'][0];

        if (findItemsAdvanced['ack'][0] == 'Success'){
          console.log("Successful response")
          var totalEntries = findItemsAdvanced['paginationOutput'][0]['totalEntries'][0];

          items = Array();
          items = findItemsAdvanced['searchResult'][0]['item'];

          filtered_items = Array();
          if(totalEntries > 0){
            for(j=0;j<=items.length;j++){ 
              var item = items[j];
              try {
                 if(item != undefined) {
                  if( item['galleryURL'][0] == undefined ||  item['galleryURL'][0] == null) {
                    galleryURL =  'https://thumbs1.ebaystatic.com/%2520pict/04040_0.jpg';
                  }
                  else {
                    galleryURL =  item['galleryURL'][0];
                  }
                  itemid       = item['itemId'][0];
                  title        = item['title'][0];
      
                  conditionDisplayName = item['condition'][0]['conditionDisplayName'][0];
                  currentPrice = item['sellingStatus'][0]['convertedCurrentPrice'][0]['__value__'];

                  if(item['viewItemURL'][0] == null || item['viewItemURL'][0] == undefined) {
                    viewitemURL = "https://www.ebay.com";
                  }
                  else {   
                    viewitemURL = item['viewItemURL'][0];
                  }
                  location   =  item['location'][0];  
                  categoryName = item['primaryCategory'][0]['categoryName'][0];
                  topRatedListing = item['topRatedListing'][0];
                  shippingInfo = item['shippingInfo'][0];
                  shippingCost = item['shippingInfo'][0]['shippingServiceCost'][0]['__value__'];
                  //console.log(shippingInfo);

                  /*try {

                    handlingTime = item['shippingInfo'][0]['handlingTime'][0];
                    shippingType = item['shippingInfo'][0]['shippingType'][0];
                    shippingCost = item['shippingInfo'][0]['shippingServiceCost'][0]['__value__'];
                    shipToLocation = item['shippingInfo'][0]['shipToLocations'][0];
                    ExpeditedShipping = item['shippingInfo'][0]['expeditedShipping'][0];
                    OneDayShippingAvailable = item['shippingInfo'][0]['oneDayShippingAvailable'][0];
  
                    shippingInfo = { 'HandlingTime' : handlingTime, 
                                     'ShippingType' : shippingType,
                                     'ShippingCost' : shippingCost,
                                     'ShipToLocation' : shipToLocation,
                                     'ExpeditedShipping' : ExpeditedShipping,
                                     'OneDayShippingAvailable' : OneDayShippingAvailable
                                     };
                  }
                  catch(e) {
                    continue;
                  }*/
                  
                  BestOfferEnabled = item['listingInfo'][0]['bestOfferEnabled'][0];
                  BuyItNowAvailable = item['listingInfo'][0]['buyItNowAvailable'][0];
                  ListingType = item['listingInfo'][0]['listingType'][0];
                  Gift = item['listingInfo'][0]['gift'][0];
                  WatchCount = item['listingInfo'][0]['watchCount'][0];
          
                  if(shippingCost && shippingInfo && topRatedListing && itemid && title && galleryURL && currentPrice && location && categoryName && conditionDisplayName && BestOfferEnabled && BuyItNowAvailable && ListingType && Gift && WatchCount && viewitemURL){
                     console.log(filtered_items.length);
                     var len = filtered_items.push({'shippingCost' : shippingCost , 'shippingInfo': shippingInfo,'topRatedListing': topRatedListing, 'itemid': itemid, 'title' : title, 'galleryURL' : galleryURL, 'viewitemURL':  viewitemURL, 'currentPrice' : currentPrice, 'location' : location, 'categoryName' : categoryName, 'conditionDisplayName' : conditionDisplayName, 'BestOfferEnabled': BestOfferEnabled, 'BuyItNowAvailable':BuyItNowAvailable, 'ListingType': ListingType, 'Gift':Gift, 'WatchCount':WatchCount});
                     if(len >= 50) break;
                 }
                }
              }   
              catch(error) {
                continue;
              }
          }
          console.log(filtered_items.length);   
          res.status(200).json({'status' : 'ok', 'items' : filtered_items, 'totalEntries' : totalEntries, 'message': "Successful : Entries Found"})
        }
        else {
          res.status(200).json({'status' : 'ok', 'items' : filtered_items, 'totalEntries' : totalEntries, 'message': "No Results Found"})
        }
      }
        else {
          console.log('Error Occurred')
      }
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
//404 Responses
app.use(function (req, res, next) {
  res.status(404).json({"message" : "Sorry can't find that resource!"})
})

//Error Handling
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).json({"message" : 'Some Error at the Server Side!'})
})

module.exports = app;