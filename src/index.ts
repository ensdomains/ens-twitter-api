const express = require('express')
const moment = require('moment')
const twitter = require('twitter');

import { Status as Tweet } from 'twitter-d';
import {
  daily,
  registered,
  expired,
  released,
  nopremium
} from './queries'

require('dotenv').config()

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  CONFIG_TEST
} = process.env
const TWITTER_CLIENT = new twitter({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token_key: TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
});
import {
  HOUR, formatShortDate, pluralize, generateSummary
} from './util'
let SCREEN_NAME

TWITTER_CLIENT.get('/account/verify_credentials',  function(error, tweet, response) {
  if(error) console.log(`APP_LOG:TWITTER_CONNECTION:ERROR:`, JSON.stringify(error))
  console.log(`APP_LOG:Connected as ${tweet.screen_name}`)
  SCREEN_NAME = tweet.screen_name
})

const promisifyTweet = async (action, endpoint, params): Promise<Tweet> => {
  return new Promise<Tweet> ((resolve, reject) => {
    try{
      TWITTER_CLIENT[action](endpoint, params, function (err, data, response) {
        if (err) {
          reject(err);
        }
        resolve(data);
      })
    }catch(e){
      console.log('APP_LOG:PROMISE_ERROR', e)
    }
  })
}
const app = express();

const onlyCron = (req, res, next) => {
  if (req.get('X-Appengine-Cron') !== 'true') {
    return res.status(401).send('Not allowed').end()
  }else{
    next()
  }
}

app.all('/tweet/*', onlyCron);

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/daily', function (req, res) {
  daily().then(messages => res.json(messages))
});

app.get('/registered', function (req, res) {
  registered().then(messages => res.json(messages))
});

app.get('/expired', function (req, res) {
  expired().then(messages => res.json(messages))
});

app.get('/released', function (req, res) {
  released().then(messages => res.json(messages))
});

app.get('/nopremium', function (req, res) {
  nopremium().then(messages => res.json(messages))
});

async function threadTweet(summary, messages, textHandler) {
  const tweets = []
  if(messages.length > 0){
    let tweet: Tweet = await promisifyTweet('post', 'statuses/update', {status: summary})
    console.log(`APP_LOG:TWEET: ${summary}`)
    tweets.push(summary)
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      let text = textHandler(m)
      tweets.push(text)
      tweet = await promisifyTweet('post', 'statuses/update', {status: text, in_reply_to_status_id: tweet.id_str })
      console.log(`APP_LOG:COMMENT (${i}/ ${messages.length}): ${text}`)
    }
  }
  return tweets
}

app.get('/tweet/registered', async function (_, res) {
  const messages = await registered(HOUR)
  const summary = generateSummary('registered', messages.length)
  const tweets = await threadTweet(summary, messages, (m) => {
    const duration = Math.round(moment.duration(moment(m.expiryDate * 1000).diff(moment())).as('year'))
    const name = m.domain.name
    return `${name} was just registered for ${duration} year${ pluralize(duration) } https://app.ens.domains/name/${name}`
  })
  res.send(tweets.join('\n'));
});

app.get('/tweet/expired', async function (_, res) {
  const messages = await expired(HOUR)
  const summary = generateSummary('expired', messages.length)
  const tweets = await threadTweet(summary, messages, (m) => {
    return `${m.domain.name} was just expired and will be relased in 90 days`
  })
  res.send(tweets.join('\n'));
});

app.get('/tweet/released', async function (_, res) {
  const messages = await released(HOUR)
  const summary = generateSummary('released', messages.length)
  const tweets = await threadTweet(summary, messages, (m) => {
    return `${m.domain.name} was just released and available for registration with premium at https://app.ens.domains/name/${m.domain.name}`
  })
  res.send(tweets.join('\n'));
});

app.get('/tweet/nopremium', async function (_, res) {
  const messages = await nopremium(HOUR)
  const summary = `${messages.length} .eth name${ pluralize(messages.length) } became available for registration with no premium in the last hour #ensnopremium`
  const tweets = await threadTweet(summary, messages, (m) => {
    return `${m.domain.name} is now available for registration with no premium at https://app.ens.domains/name/${m.domain.name}`
  })
  res.send(tweets.join('\n'));
});

app.get('/user/:page', async function (req, res) {
  try{
    TWITTER_CLIENT.get('/users/search', {q:'\.eth', count:20, page:req.params.page},  function(error, tweets, response){
      if(error) (res.json([]))
      console.log(tweets);  // The favorites.
      res.json(tweets)
    })  
  }catch(e){
    console.log({e})
  res.json([])
  }
});

app.get('/tweet/daily', function (req, res) {
  daily().then(m =>{
    const total = m.totalEthRegistered - m.totalEthReleased
    const search = `from:@${SCREEN_NAME} #ensdaily`
    const text = `#ensdaily (${ formatShortDate(m.startDate) }) ${total} @ensdomains .eth names were created (${ m.totalEthRegistered} registered - ${m.totalEthReleased} released ) and ${ m.totalEthRenewed} domains were  renewed.`
    TWITTER_CLIENT.get('search/tweets', {q:search}, function(error, tweets, response){
      if(error) (res.json([]))
      let option, action
      if(tweets && tweets.statuses && tweets.statuses.length > 0){
        const status = tweets.statuses[0]
        action = 'Retweet'
        option = {status: text, attachment_url:`https://twitter.com/${SCREEN_NAME}/status/${status.id_str}`}
      }else{
        option = {status: text}
        action = 'Tweet'
      }
      console.log({action, option})
      TWITTER_CLIENT.post('statuses/update', option,  function(error, tweet, response) {
        res.json(`${action} ${text}` + JSON.stringify(error || response))
      })
    })
  })
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`APP_LOG::App listening on port ${PORT}`);
  console.log(`APP_LOG:CONFIG_TEST: ${CONFIG_TEST}`)
});