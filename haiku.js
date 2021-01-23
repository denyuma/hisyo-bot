'use strict';	
const Twitter = require('twitter-lite');	
const cron = require('cron').CronJob;	
const findHaiku = require('./lib/findHaiku');	

const twitter = new Twitter({	
  consumer_key: process.env.TWITTER_API_CONSUMER_KEY,	
  consumer_secret: process.env.TWITTER_API_CONSUMER_SECRET,	
  access_token_key: process.env.TWITTER_API_ACCESS_TOKEN_KEY,	
  access_token_secret: process.env.TWITTER_API_ACCESS_TOKEN_SECRET	
});	

const checkedTweets = [];	

function getHomeTimeLine() {	
  twitter.get('statuses/home_timeline')	
    .then((tweets) => {	
      const tweetData = tweets.map(t => { return { text: t.text, id_str: t.id_str, user_name: t.user.screen_name } });	
      console.log(tweetData);	
      findHaiku.find575(tweetData)	
        .then((results) => {	
          console.log(results);	
          results.forEach((haikuResult) => {	
            if (haikuResult && !isCheckedHaiku(haikuResult)) {	
              twitter.post('statuses/update', {	
                status: '@' + haikuResult.user_name + ' ' + haikuResult.haiku + ' 5 7 5！',	
                in_reply_to_status_id: haikuResult.id_str	
              }).then((tweet) => {	
                console.log(tweet);	
              }).catch((err) => {	
                console.error(err);	
              });	

              checkedTweets.unshift(haikuResult);	
            }	
          });	
        }).catch((err) => {	
          console.error(err);	
        })	
    }).catch((err) => {	
      console.error(err);	
    })	
}	

function isCheckedHaiku (homeTimeLineTweet) {	
  for (let checkKey = 0; checkKey < checkedTweets; checkKey++) {	
    const checkedTweet = checkedTweets[checkKey];	
    if (checkedTweet.id_str === homeTimeLineTweet.id_str && checkedTweet.text === homeTimeLineTweet.text) {	
      return true;	
    }	
  }	
  return false;	
}	

const cronJob = new cron({	
  cronTime: '00 0-59/3 * * * *',	
  start: true,	
  onTick: function () {	
    getHomeTimeLine();	
  }	
});	

getHomeTimeLine(); 