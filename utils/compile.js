require('dotenv').config()

const SOLC = require('solc')
const PATH = require('path')
const FS = require('fs')

const HDA_PATH = PATH.resolve(__dirname, process.env.CONTRACT_PATH, 'HDA.sol')
const OWNABLE_PATH = PATH.resolve(__dirname, process.env.CONTRACT_PATH, 'Ownable.sol')
const HDA_SRC = FS.readFileSync(HDA_PATH, 'utf-8')
const OWNABLE_SRC = FS.readFileSync(OWNABLE_PATH, 'utf-8')

const generateSource = () => {
  const init = HDA_SRC
  let src = ''
  init.split('\n').forEach(
    (x) => {
      if (!x.match(/import/) && !x.match(/pragma/)) {
        src += x + '\n'
      }
    })
  console.log(OWNABLE_SRC + '\n' + src)
  return OWNABLE_SRC + '\n' + src
}

const CONFIG = {
  language: 'Solidity',
  sources: {
    hda: { content: generateSource() }
  },
  settings: {
    outputSelection: {
      '*': { '*': ['*'] }
    }
  }
}

const COMPILATION = SOLC.compile(JSON.stringify(CONFIG))
const CONTRACTS = JSON.parse(COMPILATION).contracts
module.exports = { contracts: CONTRACTS }
