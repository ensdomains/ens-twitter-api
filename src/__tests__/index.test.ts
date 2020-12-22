import { parser } from '../util';

const testcases = [
  {input:'vitalik.eth', output:'vitalik.eth'},
  {input:'ETH Zürich', output:null},
  {input:'$eth', output:null},
  {input:'antiprosynthesis.eth ⟠', output:'antiprosynthesis.eth'},
  {input:'Anthony Sassano | sassal.eth 🏴', output:'sassal.eth'},
  {input:'Eth 2.0 Deposit Contract - Progress Meter Bot', output:null},
  {input:'DeFi Dad ⟠ defidad.eth', output:'defidad.eth'},
  {input:'⟠ toast.eth 🦄', output:'toast.eth'},
  {input:'alessio de vecchi ⟠ alessiodevecchi.eth', output:'alessiodevecchi.eth'},
  {input:'Rick Dudley (afdudley.eth)', output:'afdudley.eth'},
  {input:'Chalexov.eth 🦏 🪐 🕷🪐', output:'chalexov.eth'}
]

testcases.forEach(t => {
  test(`Parse ${t.input}`, () => {
    expect(parser(t.input)).toBe(t.output)
  })
});