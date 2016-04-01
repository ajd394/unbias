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
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

//
// var dbCredentials = {
// 	dbName : 'zika_boom_bika'
// };

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
//var url = 'mongodb://lehighhackers.mybluemix.net:27017/zika_boom_bika_tika_tika';
var url = 'mongodb://localhost:27017/zika_boom_bika_tika_tika';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  db.authenticate('zika','zika',function(){
    console.log("Connected correctly to server");
    var collection = db.collection('alchemy');


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
          db.alchemy.insert({url:response});

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


  });

        // Do something with data
      });
    });
  });


  //db.close();
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


// start server on the specified port and binding host
http.listen(appEnv.port, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log("server starting on ");
});
