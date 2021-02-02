export const HOUR = 1
export const GRACE_PERIOD = 90
export const DECAY_PERIOD = 28
export function formatDate(date){
  return date.utc().format('MMMM Do YYYY, h:mm:ss a (UTC)')
}

export function formatShortDate(data){
  return data.utc().format('MMMM Do YYYY')
}

export const pluralize = (num) => {
  return (num && num > 1 ? 's' : '')
}

export function generateSummary(verb, length) {
  return `${length} .eth name${ pluralize(length) } ${ length === 1 ? 'has' : 'have' } been ${verb} in the last hour #ens${verb}`
}

export function parser(input){
  let matched = input.match(/(.*\.eth)/)
  if(matched){
    // console.log({matched})
    const split = matched[0].toLowerCase().split(/ |\(/)
    return split[split.length - 1]
  }else{
    return null
  }
}

export function buildUrl(name, campaign){
  return `https://app.ens.domains/name/${name}?utm_source=twitter&utm_campaign=${campaign}`
}