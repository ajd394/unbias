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


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('url', function(url){
    //console.log(url.url);
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
      //db.alchemy.insert({url:response});

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


// start server on the specified port and binding host
http.listen(appEnv.port, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log("server starting on ");
});
