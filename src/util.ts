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
