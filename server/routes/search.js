const express = require('express')
const router = express.Router();
const request = require('request');

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

router.get('/', async (req, res, next) =>
	{s
        var keywords = req.query.keywords;
        var min_price = req.query.min_price;
        var max_price = req.query.max_price;
        var condition1 = req.query.new;
        console.log(keywords);
        console.log(min_price);
        console.log(max_price);
        console.log(max_price);
        var url = "https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=NaureenF-CS571Web-PRD-92eba3d7e-ea9abf29&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&"+keywords;
        body = await make_request(url)
        console.log('Reached here')
        res.status(200).json({'payload':body, 'message':"Succesful"});
    })
        
module.exports = router;