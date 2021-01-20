# ENS twitter api

Generic endpoints for twitter related bots and api

## API

## Public

### /user/:page

Returns twitter user search results

## Cron only

### /tweet/daily

Tweets daily ENS stats. If there are tweets with #ensdaily in the previous tweets, it will quote tweets.

Example message

- #ensdaily (December 6th 2020, 12:00:00 am (UTC)) 726 @ensdomains .eth names were created (1000 registered - 274 released ) and 588 domains were  renewed.`

### /tweet/registered

Tweets when ad domain is registered (summary + individual name in the thread)

Example message

- `#ensregistrations 1 .eth name has been registered in the last hour
- vitalik.eth was just registered for 1 year(s) https://app.ens.domains/name/vitalik.eth`

### /tweet/expired

Tweets when a domain is expired (summary + individual name in the thread)

Example message

- #ensrexpirations 1 .eth name has been expired in the last hour
- vitalik.eth was just expired and will be released in 90 days

### /tweet/tobereleased/:duration-:unit/:interval?

Tweets when a domain is to released AND it can find its twitter profile (summary + individual name in the thread)

Example message

- /tweet/tobereleased/13-hours
- 18 .eth names will be released in the next 14 hours. Going to remind 1 tweep who sets .eth name as twitter handle #ens14hourstobereleased
- Hi @vitalik vitalik.eth will be released in the next 13 hours. Make sure to renew at https://app.ens.domains/name/vitalik.eth if you still wish to keep the name.

### /tweet/released

Tweets when a domain is released (summary + individual name in the thread)

Example message

- #ensrexpirations 1 .eth name has been released in the last hour
- vitalik.eth was just released and available for registration with premium at https://app.ens.domains/name/vitalik.eth

### /tweet/nopremium

Tweets when a domain is available with no premium (summary + individual name in the thread)

Example message

- #ensnopremium 1 .eth name became avaialble for registration with no premium in the last hour
- vitalik.eth is now available for registration with no premium at https://app.ens.domains/name/vitalik.eth

## Setup

Setup twitter credentials

```
cp env.copy .env
```

Edit the followings

```
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=
CONFIG_TEST=
```

```
yarn
yarn build && yarn start
```

## Deploy (to GAE)

```
yarn deploy
yarn deploy:cron
```

## TODO

- Add `cost` into subgraph so that it can capture the registration cost
- Add `registration_data` on NewOwner event into subgraph so that it can capture daily number of subdomains registered into the stats
- Optimise /tweet/expirations endpoint so that it does not go over twitter's limit (900 per every 15 min)