/*eslint-env node*/

var apikey_old1 = "9055d0d69f924779e29aae25b02a53b2df49dd50";
var apikey_old = "f0cece79e269d3f9fd6c0756c71595b8f819a3fd";
var apikey = "e861f8c22fd76c632624779e438ebaf678921367";
var apikey_newer = "ba018d06378441a610a5b83bec54851cc420db3d";
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
var watson = require('watson-developer-cloud');

var tone_analyzer = watson.tone_analyzer({
  username: '007eeda6-d06f-4cc7-8ab2-5b4c230aad98',
  password: 'Ub7w7gSEBeB',
  version: 'v3-beta',
  version_date: '2016-02-11'
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('url', function(url){
    //console.log(url.url);
    alchemy.combined(url.url, ["author","entity","concept","textext"], {"sentiment":1}, function(err, response) {
      if (err){
        throw err;
      }
      if(response.status === 'ERROR'){
        throw "API Error" + response.statusInfo;
      }

      var author = response.author;
      var entities = response.entities;
      var keywords = response.keywords;
      var concepts = response.concepts;

      //console.log(response);


      alchemy.text(url.url, {}, function(err, rest) {
        if (err) throw err;

        var text = rest.text;

        tone_analyzer.tone({ "text": text, sentences: "false"}, function(err, tone) {
            if (err)
              console.log(err);
            else{
              response.toneAnal2 = tone;
              io.emit('resp', response);
            }
        });
      });
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

function hunh(){
  alchemy.apiKeyInfo({}, function(err, response) {
    if (err) throw err;

    // Do something with data
    console.log('Status:', response.status, 'Consumed:', response.consumedDailyTransactions, 'Limit:', response.dailyTransactionLimit);

  });
}

hunh();

// start server on the specified port and binding host
http.listen(appEnv.port, function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log("server starting on ");
});
