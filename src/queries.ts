import { request } from 'graphql-request'
import {
  GET_REGISTRATIONS,
  GET_BLOCK,
  GET_RENEWED,
  GET_REGISTERED
} from './subgraph'

import {
  GRACE_PERIOD, DECAY_PERIOD,
} from './util'

const moment = require('moment')
const ENSURL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'
const BLOCKSURL = 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks'

export const daily = async () => {
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

export const registered = async (hour = 1) => {
  const startDate = moment().subtract(hour, 'hour')
  const endDate = moment()
  const { registrations:nameRegistered } = await request(ENSURL, GET_REGISTERED, { registrationDateGt:startDate.unix(), registrationDateLt:endDate.unix() })
  return nameRegistered
}

export const expired = async (hour = 1) => {
    const expiryDateGt = moment().subtract(hour, 'hour')
    const expiryDateLt = moment()
    let { registrations: expiredRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:expiryDateGt.unix(), expiryDateLt:expiryDateLt.unix() })
    return expiredRegistrations
}

export const released = async (hour = 1) => {
  const expiryDateGt = moment().subtract(hour, 'hour')
  const expiryDateLt = moment()
  const releaseDateGt = expiryDateGt.clone().subtract(GRACE_PERIOD, 'days')
  const releaseDateLt = expiryDateLt.clone().subtract(GRACE_PERIOD, 'days')
  let { registrations: releasedRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:releaseDateGt.unix(), expiryDateLt:releaseDateLt.unix() })
  return releasedRegistrations
}

export const nopremium = async (hour = 1) => {
  const expiryDateGt = moment().subtract(hour, 'hour')
  const expiryDateLt = moment()
  const noPremiumDateGt = expiryDateGt.clone().subtract(GRACE_PERIOD + DECAY_PERIOD, 'days')
  const noPremiumDateLt = expiryDateLt.clone().subtract(GRACE_PERIOD + DECAY_PERIOD, 'days')
  let { registrations: noPremiumRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:noPremiumDateGt.unix(), expiryDateLt:noPremiumDateLt.unix() })
  return noPremiumRegistrations
}