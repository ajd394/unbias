/*eslint-env node*/

var apikey_old = "9055d0d69f924779e29aae25b02a53b2df49dd50";
var apikey = "f0cece79e269d3f9fd6c0756c71595b8f819a3fd";
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var AlchemyAPI = require('alchemy-api');
var alchemy = new AlchemyAPI(apikey);
var AlchemyNewsAPI = require('alchemy-news-api');
var alchemyNewsAPI = new AlchemyNewsAPI(apikey);


var dbCredentials = {
	dbName : 'zika_boom_bika'
};


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('url', function(url){
    //console.log(url);
    //console.log(url.url);

    // db.index(function (er, result){
    //   if (er){
    //     throw er;
    //   }
    //
    //   console.log('The database has ?');
    //
    // });

    db.find({"selector": {"_id": {"$gt": 0}}}, function(er, result){
      if (er){
        throw er;
      }

      if (result.docs.length > 0){
        console.log("Record found");
        console.log(result);
      }
      else{
        console.log("Empty set");
      }
    });

    alchemy.combined(url.url, ["author","entity","concept"], {"sentiment":1}, function(err, response) {
      if (err){
        throw err;
      }
      if(response.status === 'ERROR'){
        throw "API Blueballs " + response.statusInfo;
      }

      // See http://www.alchemyapi.com/api/combined-call/ for format of returned object.
      // Each feature response will be available as a separate property

      var author = response.author;
      var entities = response.entities;
      var keywords = response.keywords;
      var concepts = response.concepts;

      console.log(response);
      db.insert({url:response});

      //console.log(entities);
      // console.log("Author:" + author);
      // console.log("entity:" + entity);
      // console.log("keyword:" + keyword);
      // console.log("concept:" + concept);


      // var entity = entities[0];
      //
      // var sentimentQuery = {
      //     'title': entity.text,
      //     'sentiment_type': inverseSentiment(entity.sentiment.type),
      //     'sentiment_score': invertSentimentScore(entity.sentiment.score),
      //     'return': ['url']
      // };
      //
      // console.log(sentimentQuery);
      // alchemyNewsAPI.getNewsBySentiment(sentimentQuery, function (error, resp) {
      //     if (error) {
      //         console.log(error);
      //     } else {
      //         // do something with response
      //         result = resp.result;
      //         if(result.status !== 'OK'){
      //           throw "Error in News";
      //         }
      //         console.log(result.docs);
      //         console.log(result.docs.source);
      //     }
      // });

      io.emit('resp', response);

      // Do something with data
    });
  });
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

function inverseSentiment(sentiment){
  var result = 'neutral';
  if(sentiment === 'positive'){
    result =  'negative';
  }else if (sentiment === 'negative'){
    result =  'positive';
  }
  return result;
}

function invertSentimentScore(sentimentScore){
  var result = '>0';
  sentimentScore *= -1;
  if(sentimentScore > 0){
    result = '>' + sentimentScore;
  }else{
    result = '<' + sentimentScore;
  }
  return result;
}



function initDBConnection() {

	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		// Pattern match to find the first instance of a Cloudant service in
		// VCAP_SERVICES. If you know your service key, you can access the
		// service credentials directly by using the vcapServices object.
		for(var vcapService in vcapServices){
			if(vcapService.match(/cloudant/i)){
				dbCredentials.host = vcapServices[vcapService][0].credentials.host;
				dbCredentials.port = vcapServices[vcapService][0].credentials.port;
				dbCredentials.user = vcapServices[vcapService][0].credentials.username;
				dbCredentials.password = vcapServices[vcapService][0].credentials.password;
				dbCredentials.url = vcapServices[vcapService][0].credentials.url;

				cloudant = require('cloudant')(dbCredentials.url);

				// check if DB exists if not create
				cloudant.db.create(dbCredentials.dbName, function (err, res) {
					if (err) { console.log('could not create db ', err); }
				});

				db = cloudant.use(dbCredentials.dbName);
				break;
			}
		}
		if(db===null){
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		// For running this app locally you can get your Cloudant credentials
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a
		// Bluemix service.
		//dbCredentials.host = "REPLACE ME";
		//dbCredentials.port = REPLACE ME;
		//dbCredentials.user = "REPLACE ME";
		//dbCredentials.password = "REPLACE ME";
		//dbCredentials.url = "REPLACE ME";
	}
}

initDBConnection();


// start server on the specified port and binding host
http.listen(appEnv.port, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log("server starting on ");
});
