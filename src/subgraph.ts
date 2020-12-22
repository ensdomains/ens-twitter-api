import { gql } from 'graphql-request'

export const GET_REGISTRATIONS = gql`
  query getRegistrations($expiryDateGt: Int!, $expiryDateLt: Int! ){
    registrations(first:1000, where:{expiryDate_gt:$expiryDateGt, expiryDate_lt:$expiryDateLt}){
      id
      expiryDate
      registrationDate
      domain{
        name
      }
    }
  }
`

export const GET_BLOCK = gql`
  query getBlock($timestamp: Int!){
    blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: {timestamp_gt: $timestamp}) {
      id
      number
      timestamp
    }
  }   
`

export const GET_REVERSE = gql`
query getReverse($blockNumberGt: Int!, $blockNumberLt: Int!){
  nameChangeds(first:1000, where: {blockNumber_gt: $blockNumberGt, blockNumber_lt: $blockNumberLt } ){
    id
    name
  }
}
`

export const GET_REGISTERED = gql`
  query getRegistered($registrationDateGt: Int!, $registrationDateLt: Int! ){
    registrations(first:1000, where:{registrationDate_gt:$registrationDateGt, registrationDate_lt:$registrationDateLt}){
      id
      expiryDate
      registrationDate
      domain{
        name
        parent{
          name
        }
      }
    }
  }
`

export const GET_RENEWED = gql`
  query getRenewed($blockNumberGt: Int!, $blockNumberLt: Int!){
    nameReneweds(first:1000, where: {blockNumber_gt: $blockNumberGt, blockNumber_lt: $blockNumberLt } ){
      blockNumber
      registration{
        domain{
          name
          parent{
            name
          }
        }
      }
    }
  }
`