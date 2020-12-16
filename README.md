# ENS twitter api

Generic endpoints for twitter related bots and api

## API

### Available

### /tweet/daily

Tweets daily ENS stats. If there are tweets with #ensdaily in the previous tweets, it will quote tweets.

Example message

- #ensdaily (December 6th 2020, 12:00:00 am (UTC)) 726 @ensdomains .eth names were created (1000 registered - 274 released ) and 588 domains were  renewed.`

### /tweet/user/:page

Returns twitter user search results

### WIP

### /tweet/registrations

Example message

- vitalik.eth was just registered for 1 year(s) https://app.ens.domains/name/vitalik.eth`

### /tweet/expirations

Tweets when a user is expired, released, and available with no premium

Example message

- vitalik.eth was just expired and will be relased in 90 days
- vitalik.eth was just released and available for registration with premium at https://app.ens.domains/name/vitalik.eth
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
APP_SECRET=
```

```
yarn
yarn build && yarn run exec
```

## Deploy (to GAE)

```
yarn deploy
```

## TODO

- Add `cost` into subgraph so that it can capture the registration cost
- Add `registration_data` on NewOwner event into subgraph so that it can capture daily number of subdomains registered into the stats
- Optimise /tweet/expirations endpoint so that it does not go over twitter's limit (900 per every 15 min)