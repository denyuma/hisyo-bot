'use strict';	
const Twitter = require('twitter-lite');	
const cron = require('cron').CronJob;	
const moment = require('moment-timezone');	

const twitter = new Twitter({	
  consumer_key: process.env.TWITTER_API_CONSUMER_KEY,	
  consumer_secret: process.env.TWITTER_API_CONSUMER_SECRET,	
  access_token_key: process.env.TWITTER_API_ACCESS_TOKEN_KEY,	
  access_token_secret: process.env.TWITTER_API_ACCESS_TOKEN_SECRET	
});	

function sendDirectMessage(message) {	
  twitter.post('direct_messages/events/new', {	
    event: {	
      type: 'message_create',	
      message_create: {	
        target: {	
          recipient_id: '1303097365859987456'	
        },	
        message_data: {	
          text: message	
        }	
      }	
    }	
  }).then((response) => {	
    console.log(response);	
  }).catch((err) => {	
    console.error(err);	
  });	
}	

const savedTweetsMap = new Map();	

function getHomeTimeLine() {	
  console.log('cron came!');	
  twitter.get('statuses/home_timeline', {count: 200})	
    .then((tweets) => {	
      dataFormats(tweets);	
      console.log(tweets[0].created_at);	

      //初回は起動時は取得するだけで終了	
      if (savedTweetsMap.size === 0) {	
        tweets.forEach((homeTimeLineTweet, key) => {	
          savedTweetsMap.set(homeTimeLineTweet.id, homeTimeLineTweet);	
        });	

        return;	
      }	

      const oldestTime = tweets[tweets.length - 1].created_at;	
      savedTweetsMap.forEach((savedTweet, key) => {	
        let isFound = false;	
        for (let i = 0; i < tweets.length; i++) {	
          if (savedTweet.created_at < oldestTime) {	
            // 調査ができなくなったツイート	
            savedTweetsMap.delete(key);	
            isFound = true;	
            break;	
          }	
          if (savedTweet.id_str === tweets[i].id_str) {	
            // 削除されていないツイート	
            isFound = true;	
            break;	
          }	
        }	
        if(!isFound) {	
          const message = `削除されたツイートが見つかりました！\n` +	
          `ユーザー名：${savedTweet.user.name}\n` +	
          `時刻：${savedTweet.created_at}\n` +	
          savedTweet.text;	
        sendDirectMessage(message);	
        savedTweetsMap.delete(key);	
        }	
      });	
      // 新しいツイートを追加	
      for (let i = 0; i < tweets.length; i++) {	
        if (!savedTweetsMap.has(tweets[i].id)) {	
          savedTweetsMap.set(tweets[i].id, tweets[i])	
        }	
      }	

    }).catch((err) => {	
      console.error(err);	
    })	
}	

function dataFormats(tweets) {	
  tweets.forEach((tweet, key) => {	
    const times = tweet.created_at.split(' ');	
    const date = new Date(times[1] + ' ' + times[2] + ', ' + times[5] + ' ' + times[3]);	
    tweet.created_at = moment(date).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');	
  });	

  return tweets;	
}	

const cronJob = new cron({	
  cronTime: '00 */2 * * * *', //2分ごとに実行	
  start: true,	
  onTick: function() {	
    getHomeTimeLine();	
  }	
});	

getHomeTimeLine(); 