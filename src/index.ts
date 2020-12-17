import { request } from 'graphql-request'
const express = require('express')
const moment = require('moment')
const twitter = require('twitter');

import {
  GET_REGISTRATIONS,
  GET_BLOCK,
  GET_RENEWED,
  GET_REGISTERED
} from './subgraph'
import { Status as Tweet, User } from 'twitter-d';

require('dotenv').config()

const ENSURL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'
const BLOCKSURL = 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'
const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  APP_SECRET,
  CONFIG_TEST
} = process.env
const TWITTER_CLIENT = new twitter({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token_key: TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
});
let SCREEN_NAME
TWITTER_CLIENT.get('/account/verify_credentials',  function(error, tweet, response) {
  console.log(tweet.screen_name)
  SCREEN_NAME = tweet.screen_name
})

function formatDate(date){
    return date.utc().format('MMMM Do YYYY, h:mm:ss a (UTC)')
}

function formatShortDate(data){
  return data.utc().format('MMMM Do YYYY')
}

const daily = async () => {
  const startTime = moment().unix()
  const startDate = moment().subtract(1, 'day').startOf('day')
  const endDate = moment().subtract(1, 'day').endOf('day')
  const releasedDateGt = startDate.clone().subtract(90, 'day')
  const releasedDateLt = endDate.clone().subtract(90, 'day')
  const { blocks:startBlock } = await request(BLOCKSURL, GET_BLOCK, { timestamp:startDate.unix() })
  const { blocks:endBlock } = await request(BLOCKSURL, GET_BLOCK, { timestamp:endDate.unix() })
  console.log({
    startDate,
    endDate,
    startBlock,
    endBlock
  })
  const { nameReneweds } = await request(ENSURL, GET_RENEWED, {
    blockNumberGt:parseInt(startBlock[0].number),
    blockNumberLt:parseInt(endBlock[0].number)
  })
  const { registrations:nameRegistered } = await request(ENSURL, GET_REGISTERED, { registrationDateGt:startDate.unix(), registrationDateLt:endDate.unix() })
  const { registrations: releasedRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:releasedDateGt.unix(), expiryDateLt:releasedDateLt.unix() })
  const endTime = moment().unix()
  return({
    runningTime: (endTime - startTime),
    startDate,
    endDate,
    startBlock,
    endBlock,
    totalEthRenewed: nameReneweds.length,
    totalEthRegistered:nameRegistered.length,
    totalEthReleased: releasedRegistrations.length
  })
}

const expirations = async (hour = 1) => {
    let skip = 0
    const expiryDateGt = moment().subtract(hour, 'hour')
    const expiryDateLt = moment()
    const releaseDateGt = expiryDateGt.clone().subtract(90, 'days')
    const releaseDateLt = expiryDateLt.clone().subtract(90, 'days')
    const noPremiumDateGt = releaseDateGt.clone().subtract(28, 'days')
    const noPremiumDateLt = releaseDateLt.clone().subtract(28, 'days')
    let { registrations: expiredRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { skip, expiryDateGt:expiryDateGt.unix(), expiryDateLt:expiryDateLt.unix() })
    let { registrations: releasedRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { skip, expiryDateGt:releaseDateGt.unix(), expiryDateLt:releaseDateLt.unix() })
    let { registrations: noPremiumRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { skip, expiryDateGt:noPremiumDateGt.unix(), expiryDateLt:noPremiumDateLt.unix() })
    return {
        expiredRegistrations,
        releasedRegistrations,
        noPremiumRegistrations
    }
}

const registrations = async (hour = 1) => {
  let skip = 0
  const startDate = moment().subtract(hour, 'hour')
  const endDate = moment()
  const { registrations:nameRegistered } = await request(ENSURL, GET_REGISTERED, { registrationDateGt:startDate.unix(), registrationDateLt:endDate.unix() })
  return nameRegistered
}

const pluralize = (num) => {
  return (num && num > 1 ? 's' : '')
}

// const whatever2 = async (): Promise<number> => {
//   return new Promise<number>((resolve) => {
//       resolve(4);
//   });
// };

const promisifyTweet = async (action, endpoint, params): Promise<Tweet> => {
  return new Promise<Tweet> ((resolve, reject) => {
    TWITTER_CLIENT[action](endpoint, params, function (err, data, response) {
      if (err) {
        reject(err);
      }
      resolve(data);
    })
  })
}

// const app: express.Application = express();
const app = express();
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/hello', function (req, res) {
  res.send('Hello World!');
});

app.get('/expirations', function (req, res) {
  expirations().then(messages =>{
    res.json(messages);
  })
});

app.get('/registrations', function (req, res) {
  registrations().then(messages =>{
    res.json(messages);
  })
});

app.get('/tweet/registrations', async function (req, res) {
  const tweets = []
  const hour = 1
  const messages = await registrations(hour)
    const summary = `#ensregistrations ${messages.length} .eth names were registered in the last ${hour} hour${ pluralize(hour) }`
    let tweet: Tweet = await promisifyTweet('post', 'statuses/update', {status: summary})
    tweets.push(summary)
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const duration = Math.round(moment.duration(moment(m.expiryDate * 1000).diff(moment())).as('year'))
      const name = m.domain.name
      let text = `${name} was just registered for ${duration} year${ pluralize(duration) } https://app.ens.domains/name/${name}`
      tweets.push(text)
      console.log({text})
      tweet = await promisifyTweet('post', 'statuses/update', {status: text, in_reply_to_status_id: tweet.id_str })
    }
    res.send(tweets.join('\n'));
});

// Twitter rate limit is 900 per every 15 min
// The max expiration per hour would be 277 on 06/01/21 05:00
// hence it should work without any pagination
app.get('/tweet/expirations', function (req, res) {
  // TODO: Make each thread as comment
  expirations().then( data => {
    const {expiredRegistrations, releasedRegistrations, noPremiumRegistrations} = data
    let messages = []
    expiredRegistrations.map(e => {
        const message = `${e.domain.name} was just expired and will be relased in 90 days`
        messages.push(message)
        console.log(message)
    })
    releasedRegistrations.map(e => {
        const message = `${e.domain.name} was just released and available for registration with premium at https://app.ens.domains/name/${e.domain.name}`
        messages.push(message)
        console.log(message)
    })
    noPremiumRegistrations.map(e => {
        const message = `${e.domain.name} is now available for registration with no premium at https://app.ens.domains/name/${e.domain.name}`
        messages.push(message)
        console.log(message)
    })
    res.send(messages);
  })
});

const checkSecret = (query) => {
  // TODO: Think about a way not to expose secret on cron.yaml (or use alternative like Cloud tasks)
  // return query && query.secret === APP_SECRET
  return true
}

app.get('/tweet/user/:page', async function (req, res) {
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
  if(checkSecret(req.query)){
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
  }else{
    res.status(401).send('Not allowed')
  }
});

app.get('/daily', function (req, res) {
  daily().then(messages =>{
    res.json(messages);
  })
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log(`CONFIG_TEST: ${CONFIG_TEST}`)
  console.log('Press Ctrl+C to quit.');
});