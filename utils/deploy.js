require('dotenv').config()

const COMPILE = require('./compile.js')
const WEB3_API = require('web3')
const CONTRACT = COMPILE.contracts.hda.HDA
const BYTECODE = COMPILE.contracts.hda.HDA.evm.bytecode.object
const ABI = JSON.stringify(JSON.parse(CONTRACT.metadata).output.abi)
const FS = require('fs')

const updateEnvContractAddress = async (address) => {
  const oldEnv = FS.readFileSync('./.env', 'utf-8')
  let newEnv = ''
  oldEnv.split('\n').forEach((x) => {
    if (x.match(/CONTRACT_ADDRESS=/)) {
      newEnv = newEnv + `CONTRACT_ADDRESS=${address}` + '\n'
    } else {
      newEnv = newEnv + x + '\n'
    }
  })
  FS.writeFileSync('./.env', newEnv)
  FS.writeFileSync('./contracts/address.json', JSON.stringify({ contractAddress: address }))
}

const deploy = async () => {
  const options = {
    defaultGasPrice: 0,
    transactionConfirmationBlocks: 1
  }
  const web3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, options)
  const accounts = await web3.eth.getAccounts()
  let owner = accounts[0]
  let bytecode = BYTECODE
  if (process.env.GETH) {
    bytecode = '0x' + BYTECODE
    await web3.eth.personal.unlockAccount(accounts[0], `${process.env.GETH_MAIN_PASSWORD}`, 3600000)
  }
  if (process.env.GETH) {
    owner = owner.substring(2)
    console.log(owner)
  }
  const deployedContract = await new web3.eth.Contract(JSON.parse(ABI)).deploy({ data: bytecode }).send({ from: owner, gas: '5000000' })
  FS.writeFileSync('./contracts/abi.json', ABI)
  await updateEnvContractAddress(deployedContract.address)
  console.log(`Smart contract address: ${deployedContract.address}`)
  console.log(`Owner: ${owner} granting license manager role on ${accounts[1]}`)
  await deployedContract.methods.setUserRole(accounts[1], 3).send({ from: owner })
  const ownerResponse = await deployedContract.methods.owner().call()
  console.log(ownerResponse)
  // Contract initial provisioning, 50 ETH from license manager
  const amountToSend = '50000000000000000000'
  const sendResponse = await web3.eth.sendTransaction({ from: accounts[1], to: deployedContract.address, value: amountToSend })
  console.log('Initial Provisioning Transaction Hash')
  console.log(sendResponse.transactionHash)
  const finalContractBalance = BigInt(await web3.eth.getBalance(process.env.CONTRACT_ADDRESS))
  console.log('Final contract balance:')
  console.log(finalContractBalance)
  if (process.env.GETH) {
    await web3.eth.personal.lockAccount(accounts[0])
  }
}

deploy()
