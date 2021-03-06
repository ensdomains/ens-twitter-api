import { request } from 'graphql-request'
import {
  GET_REGISTRATIONS,
  GET_REGISTRATIONS_WITH_LABEL,
  GET_BLOCK,
  GET_RENEWED,
  GET_REGISTERED,
  GET_REVERSE
} from './subgraph'

import {
  GRACE_PERIOD, DECAY_PERIOD
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
  const { blocks:startBlocks } = await request(BLOCKSURL, GET_BLOCK, { timestamp:startDate.unix() })
  const { blocks:endBlocks } = await request(BLOCKSURL, GET_BLOCK, { timestamp:endDate.unix() })
  console.log({
    startDate,
    endDate,
    startBlocks,
    endBlocks
  })
  const startBlockNumber = parseInt(startBlocks[0].number)
  const endBlockNumber = parseInt(endBlocks[0].number)
  const { nameReneweds } = await request(ENSURL, GET_RENEWED, {
    blockNumberGt:startBlockNumber,
    blockNumberLt:endBlockNumber
  })
  const { registrations:nameRegistered } = await request(ENSURL, GET_REGISTERED, { registrationDateGt:startDate.unix(), registrationDateLt:endDate.unix() })
  const { registrations: releasedRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:releasedDateGt.unix(), expiryDateLt:releasedDateLt.unix() })
  const { nameChangeds } = await request(ENSURL, GET_REVERSE, { blockNumberGt:startBlockNumber, blockNumberLt:endBlockNumber })

  const endTime = moment().unix()
  return({
    runningTime: (endTime - startTime),
    startDate,
    endDate,
    totalEthRenewed: nameReneweds.length,
    totalEthRegistered:nameRegistered.length,
    totalEthReleased: releasedRegistrations.length,
    totalReverseSet:nameChangeds.length
  })
}

export const expiredWithLabel = async(day = 7, labels) =>{
  // const startDate = moment().subtract(day, 'day').startOf('day')
  // const endDate = moment().subtract(day, 'day').endOf('day')
  // const startDate = moment().subtract(GRACE_PERIOD - day, 'days').startOf('day')
  // const endDate = moment().subtract(GRACE_PERIOD - day, 'days').endOf('day')
  const startDate = moment().subtract(GRACE_PERIOD, 'days').endOf('day')
  const endDate = moment().endOf('day')
  console.log({
    startDate, endDate, labels
  })
  const { registrations } = await request(ENSURL, GET_REGISTRATIONS_WITH_LABEL, {
    expiryDateGt:startDate.unix(), expiryDateLt:endDate.unix(), labels
  })
  return registrations
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

export const tobereleased = async (duratioin = 7, unit = 'day', interval = 1) => {
  const releaseDate = moment().subtract(GRACE_PERIOD, 'days')
  const oneweekDateLt = releaseDate.clone().add(duratioin, unit)
  const oneweekDateGt = oneweekDateLt.clone().subtract(interval, 'hour')
  let { registrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:oneweekDateGt.unix(), expiryDateLt:oneweekDateLt.unix() })
  let filtered = registrations.filter((r) =>{
    const name = r.domain.name
    // Ignore names with no decoded labels
    return !(name.match(/\[.*\]\.eth/) && name.length === 70)
  })
  return filtered
}

export const nopremium = async (hour = 1) => {
  const expiryDateGt = moment().subtract(hour, 'hour')
  const expiryDateLt = moment()
  const noPremiumDateGt = expiryDateGt.clone().subtract(GRACE_PERIOD + DECAY_PERIOD, 'days')
  const noPremiumDateLt = expiryDateLt.clone().subtract(GRACE_PERIOD + DECAY_PERIOD, 'days')
  let { registrations: noPremiumRegistrations } = await request(ENSURL, GET_REGISTRATIONS, { expiryDateGt:noPremiumDateGt.unix(), expiryDateLt:noPremiumDateLt.unix() })
  return noPremiumRegistrations
}
