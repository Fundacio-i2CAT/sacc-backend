require('dotenv').config()

const CHAI = require('chai')
CHAI.should()

const WEB3_API = require('web3')
const WEB3_OPTIONS = { defaultGasPrice: 0, transactionConfirmationBlocks: 1 }
const WEB3 = new WEB3_API(`http://${process.env.GETH_IP_ADDRESS}:${process.env.GANACHE_PORT}`, null, WEB3_OPTIONS)
WEB3.eth.transactionConfirmationBlocks = 1
WEB3.transactionConfirmationBlocks = 1
const USER_UTILS = require('./user.js')
const ACCESS_REQUEST_UTILS = require('./accessRequest.js')

const MONGO_DB = 'mongodb://127.0.0.1/blockchain_hda'
const MONGOOSE = require('mongoose')
MONGOOSE.connect(MONGO_DB, { useNewUrlParser: true })
MONGOOSE.Promise = global.Promise
MONGOOSE.set('useFindAndModify', false)
const DB = MONGOOSE.connection
DB.on('error', console.error.bind(console, 'MongoDB connection error:'))
const PUBLIC_KEYS = require('./../utils/keys.json')
const PUBLIC_KEY = require('./../schemas/publicKey.js')
PUBLIC_KEYS.map((x) => {
  PUBLIC_KEY.newPublicKey(x.address, x.publicKey)
})

describe('Access requests tests', function () {
  it('Should allow a research institution manager to create access requests', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse1.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Fairy', 'Adams', '5555555', 'adams@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const newUserResponse3 = await USER_UTILS.newUser(
      accounts[1], accounts[4], 'Mickey', 'Mouse', '5555555', 'mickey@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse3.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], accounts[5], 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Sample project', description: 'Sample description' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(accounts[5], project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2])
    getAccessRequestsResponse1.status.should.equal(200)
    // getAccessRequestsResponse1.data.totalDocs.should.equal(1)
    // getAccessRequestsResponse1.data.accessRequests.length.should.equal(1)
    getAccessRequestsResponse1.data.accessRequests[0].revoked.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].granted.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.surnames.should.equal('Mgr')
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(accounts[5].toLowerCase())
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    getAccessRequestsResponse1.data.accessRequests[0].project.title.should.equal('Sample project')
    getAccessRequestsResponse1.data.accessRequests[0].project.description.should.equal('Sample description')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[2], accounts[5], projectAddress)
    delete1.status.should.equal(200)
    const getAccessRequestsResponse12 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2])
    getAccessRequestsResponse12.status.should.equal(200)
    const getAccessRequestsResponse22 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3])
    getAccessRequestsResponse22.data.totalDocs.should.be.above(0)
    const delete2 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[3], accounts[5], projectAddress)
    delete2.status.should.equal(200)
    const getAccessRequestsResponse23 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3])
    getAccessRequestsResponse23.status.should.equal(200)
    const delete3 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[4], accounts[5], projectAddress)
    delete3.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse1.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
    const deleteUserResponse3 = await USER_UTILS.deleteUser(accounts[1], accounts[4])
    deleteUserResponse3.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], accounts[5])
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  // Skipping this test (contained in next one); in case a user has a granted access request in
  //   the smart contract without before revoking it deletion should fail
  xit('Should allow a user to accept an access request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5]
    const endUser = accounts[2]
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Project title again', description: 'Another . one' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager)
    putAccessRequestResponse1.status.should.equal(200)
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(endUser, riManager)
    delete1.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a user to revoke a previously granted access request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5].toLowerCase()
    const endUser = accounts[2].toLowerCase()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com/example.zip')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Project title', description: 'another one' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser, projectAddress)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager, projectAddress)
    putAccessRequestResponse1.status.should.equal(200)
    const getAccessRequestAsRIManager = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getAccessRequestAsRIManager.status.should.equal(200)
    getAccessRequestAsRIManager.data.accessRequests[0].should.have.property('dataUrl')
    getAccessRequestAsRIManager.data.accessRequests[0].dataUrl.should.equal('http://example.com/example.zip')
    getAccessRequestAsRIManager.data.accessRequests[0].should.have.property('encryptedPassword')
    getAccessRequestAsRIManager.data.accessRequests[0].encryptedPassword.should.have.property('ciphertext')
    getAccessRequestAsRIManager.data.accessRequests[0].encryptedPassword.should.have.property('mac')
    getAccessRequestAsRIManager.data.accessRequests[0].encryptedPassword.should.have.property('iv')
    getAccessRequestAsRIManager.data.accessRequests[0].encryptedPassword.should.have.property('ephemPublicKey')
    const putRevokeAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.revokeAccessRequest(endUser, riManager, projectAddress)
    putRevokeAccessRequestResponse1.status.should.equal(200)
    const getAccessRequestAsRIManager2 = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getAccessRequestAsRIManager2.status.should.equal(200)
    getAccessRequestAsRIManager2.data.accessRequests[0].should.not.have.property('dataUrl')
    getAccessRequestAsRIManager2.data.accessRequests[0].should.not.have.property('encryptedPassword')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(endUser, riManager, projectAddress)
    delete1.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager to get a revoked access request', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5].toLowerCase()
    const endUser = accounts[2].toLowerCase()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Second sample project', description: 'This is it ...' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager, projectAddress)
    putAccessRequestResponse1.status.should.equal(200)
    const putRevokeAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.revokeAccessRequest(endUser, riManager, projectAddress)
    putRevokeAccessRequestResponse1.status.should.equal(200)
    const projectsResponse = await ACCESS_REQUEST_UTILS.getProjects(riManager)
    projectsResponse.status.should.equal(200)
    projectsResponse.data.projects.length.should.be.above(0)
    const getRevokeAccessRequestResponse = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse.status.should.equal(200)
    getRevokeAccessRequestResponse.data.accessRequests.length.should.equal(1)
    getRevokeAccessRequestResponse.data.accessRequests[0].revoked.should.equal(true)
    getRevokeAccessRequestResponse.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse.data.accessRequests[0].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(endUser, riManager, projectAddress)
    delete1.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager to get a revoked access request from an unregistered user', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5].toLowerCase()
    const endUser = accounts[6].toLowerCase()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Second sample project', description: 'This is it ...' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager, projectAddress)
    putAccessRequestResponse1.status.should.equal(200)
    await USER_UTILS.unregisterUser(endUser)
    const projectsResponse = await ACCESS_REQUEST_UTILS.getProjects(riManager)
    projectsResponse.status.should.equal(200)
    projectsResponse.data.projects.length.should.be.above(0)
    const getRevokeAccessRequestResponse = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse.status.should.equal(200)
    getRevokeAccessRequestResponse.data.accessRequests.length.should.equal(1)
    getRevokeAccessRequestResponse.data.accessRequests[0].revoked.should.equal(true)
    getRevokeAccessRequestResponse.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse.data.accessRequests[0].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager idempotently post access requests', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5].toLowerCase()
    const endUser = accounts[2].toLowerCase()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Third sample project', description: 'This is another ...' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager, projectAddress)
    putAccessRequestResponse1.status.should.equal(200)
    const putRevokeAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.revokeAccessRequest(endUser, riManager, projectAddress)
    putRevokeAccessRequestResponse1.status.should.equal(200)
    const getRevokeAccessRequestResponse = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse.status.should.equal(200)
    getRevokeAccessRequestResponse.data.accessRequests.length.should.equal(2)
    getRevokeAccessRequestResponse.data.accessRequests[0].revoked.should.equal(true)
    getRevokeAccessRequestResponse.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse.data.accessRequests[1].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const project2 = { project: { title: 'Fourth sample project', description: 'This is another one ...' } }
    const accessRequestResponse2 = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project2)
    accessRequestResponse2.status.should.equal(200)
    const getRevokeAccessRequestResponse3 = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse3.status.should.equal(200)
    // getRevokeAccessRequestResponse3.data.accessRequests.length.should.equal(2)
    // getRevokeAccessRequestResponse3.data.accessRequests[0].revoked.should.equal(true)
    // getRevokeAccessRequestResponse3.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse3.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse3.data.accessRequests[1].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse3.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(endUser, riManager, projectAddress)
    delete1.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager idempotently post access requests', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const riManager = accounts[5].toLowerCase()
    const endUser = accounts[2].toLowerCase()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], endUser, 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER')
    newUserResponse1.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], riManager, 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Fifth sample project', description: 'This is another one again ...' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(endUser)
    getAccessRequestsResponse1.status.should.equal(200)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(riManager)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const putAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.grantAccessRequest(endUser, riManager, projectAddress)
    putAccessRequestResponse1.status.should.equal(200)
    const putRevokeAccessRequestResponse1 = await ACCESS_REQUEST_UTILS.revokeAccessRequest(endUser, riManager, projectAddress)
    putRevokeAccessRequestResponse1.status.should.equal(200)
    const getRevokeAccessRequestResponse = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse.status.should.equal(200)
    // getRevokeAccessRequestResponse.data.accessRequests.length.should.equal(1)
    // getRevokeAccessRequestResponse.data.accessRequests[0].revoked.should.equal(true)
    // getRevokeAccessRequestResponse.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse.data.accessRequests[1].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const project3 = { project: { title: 'Sixth sample project', description: 'Last one? ...' } }
    const accessRequestResponse2 = await ACCESS_REQUEST_UTILS.newAccessRequest(riManager, project3)
    accessRequestResponse2.status.should.equal(200)
    const getRevokeAccessRequestResponse3 = await ACCESS_REQUEST_UTILS.getAccessRequests(riManager)
    getRevokeAccessRequestResponse3.status.should.equal(200)
    // getRevokeAccessRequestResponse3.data.accessRequests.length.should.equal(1)
    // getRevokeAccessRequestResponse3.data.accessRequests[0].revoked.should.equal(true)
    // getRevokeAccessRequestResponse3.data.accessRequests[0].granted.should.equal(false)
    getRevokeAccessRequestResponse3.data.accessRequests[0].researchInstitutionManagerAddress.should.equal(riManager)
    getRevokeAccessRequestResponse3.data.accessRequests[1].endUserAddress.should.equal(endUser)
    getRevokeAccessRequestResponse3.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(endUser, riManager, projectAddress)
    delete1.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], endUser)
    deleteUserResponse1.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], riManager)
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager to create access requests and retrieve accepted / revoked', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse1.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Fairy', 'Adams', '5555555', 'adams@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const newUserResponse3 = await USER_UTILS.newUser(
      accounts[1], accounts[4], 'Mickey', 'Mouse', '5555555', 'mickey@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse3.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], accounts[5], 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Sample project', description: 'Sample description' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(accounts[5], project)
    const projectAddress = accessRequestResponse.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2], 'pending')
    getAccessRequestsResponse1.status.should.equal(200)
    const getAccessRequestsResponseRim = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[5], 'granted')
    getAccessRequestsResponseRim.status.should.equal(200)
    // getAccessRequestsResponse1.data.totalDocs.should.equal(1)
    // getAccessRequestsResponse1.data.accessRequests.length.should.equal(1)
    getAccessRequestsResponse1.data.accessRequests[0].revoked.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].granted.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.surnames.should.equal('Mgr')
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(accounts[5].toLowerCase())
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    // getAccessRequestsResponse1.data.accessRequests[0].project.title.should.equal('Sample project')
    // getAccessRequestsResponse1.data.accessRequests[0].project.description.should.equal('Sample description')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[2], accounts[5], projectAddress)
    delete1.status.should.equal(200)
    const getAccessRequestsResponse12 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2], projectAddress)
    getAccessRequestsResponse12.status.should.equal(200)
    const getAccessRequestsResponse22 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3], projectAddress)
    getAccessRequestsResponse22.data.totalDocs.should.be.above(0)
    const delete2 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[3], accounts[5], projectAddress)
    delete2.status.should.equal(200)
    const getAccessRequestsResponse23 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3])
    getAccessRequestsResponse23.status.should.equal(200)
    const delete3 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[4], accounts[5], projectAddress)
    delete3.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse1.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
    const deleteUserResponse3 = await USER_UTILS.deleteUser(accounts[1], accounts[4])
    deleteUserResponse3.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], accounts[5])
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })

  it('Should allow a research institution manager to create different access requests regarding different projects', async () => {
    const accounts = await WEB3.eth.getAccounts()
    const newUserResponse1 = await USER_UTILS.newUser(
      accounts[1], accounts[2], 'Sponge', 'Bob', '5555555', 'bob@example.com', null, '1212', 'END_USER', 'http://example.com',
      'eFR5W8dDpek:APA91bG6qpsHZVOtKbzw5MUzFfI8461VSq25t9Y_uPmIPAiSYqovDY2ALRbJm3VafF5bLCq1j1FE11SsUuF123dl4MvxgGIHJF92SJau9aWef4YUxRpyNZUUFx_tseK382qMsZLA4NhJ')
    newUserResponse1.status.should.equal(200)
    const newUserResponse2 = await USER_UTILS.newUser(
      accounts[1], accounts[3], 'Fairy', 'Adams', '5555555', 'adams@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse2.status.should.equal(200)
    const newUserResponse3 = await USER_UTILS.newUser(
      accounts[1], accounts[4], 'Mickey', 'Mouse', '5555555', 'mickey@example.com', null, '1213', 'END_USER', 'http://example.com')
    newUserResponse3.status.should.equal(200)
    const researchInstitutionManagerResponse = await USER_UTILS.newUser(
      accounts[1], accounts[5], 'Inst.', 'Mgr', '5555555', 'instm@example.com', '1213', null, 'RESEARCH_INSTITUTION_MANAGER')
    researchInstitutionManagerResponse.status.should.equal(200)
    const project = { project: { title: 'Sample project', description: 'Sample description' } }
    const accessRequestResponse = await ACCESS_REQUEST_UTILS.newAccessRequest(accounts[5], project)
    const projectAddress = accessRequestResponse.data.projectAddress
    const project2 = { project: { title: 'Sample project 2', description: 'Sample description 2' } }
    const accessRequestResponse2 = await ACCESS_REQUEST_UTILS.newAccessRequest(accounts[5], project2)
    const projectAddress2 = accessRequestResponse2.data.projectAddress
    accessRequestResponse.status.should.equal(200)
    const getAccessRequestsResponse1 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2], 'pending')
    getAccessRequestsResponse1.status.should.equal(200)
    const getAccessRequestsResponseRim = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[5], 'granted')
    getAccessRequestsResponseRim.status.should.equal(200)
    // getAccessRequestsResponse1.data.totalDocs.should.equal(1)
    // getAccessRequestsResponse1.data.accessRequests.length.should.equal(1)
    getAccessRequestsResponse1.data.accessRequests[0].revoked.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].granted.should.equal(false)
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.surnames.should.equal('Mgr')
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.address.should.equal(accounts[5].toLowerCase())
    getAccessRequestsResponse1.data.accessRequests[0].researchInstitutionManager.email.should.equal('instm@example.com')
    // getAccessRequestsResponse1.data.accessRequests[0].project.title.should.equal('Sample project')
    // getAccessRequestsResponse1.data.accessRequests[0].project.description.should.equal('Sample description')
    const delete1 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[2], accounts[5], projectAddress)
    delete1.status.should.equal(200)
    const delete22 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[2], accounts[5], projectAddress2)
    delete22.status.should.equal(200)
    const getAccessRequestsResponse12 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[2], projectAddress)
    getAccessRequestsResponse12.status.should.equal(200)
    const getAccessRequestsResponse22 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3], projectAddress)
    getAccessRequestsResponse22.data.totalDocs.should.be.above(0)
    const delete2 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[3], accounts[5], projectAddress)
    delete2.status.should.equal(200)
    const getAccessRequestsResponse23 = await ACCESS_REQUEST_UTILS.getAccessRequests(accounts[3])
    getAccessRequestsResponse23.status.should.equal(200)
    const delete3 = await ACCESS_REQUEST_UTILS.deleteAccessRequest(accounts[4], accounts[5], projectAddress)
    delete3.status.should.equal(200)
    const deleteUserResponse1 = await USER_UTILS.deleteUser(accounts[1], accounts[2])
    deleteUserResponse1.status.should.equal(200)
    const deleteUserResponse2 = await USER_UTILS.deleteUser(accounts[1], accounts[3])
    deleteUserResponse2.status.should.equal(200)
    const deleteUserResponse3 = await USER_UTILS.deleteUser(accounts[1], accounts[4])
    deleteUserResponse3.status.should.equal(200)
    const deleteResearchInstitutionManagerResponse = await USER_UTILS.deleteUser(accounts[1], accounts[5])
    deleteResearchInstitutionManagerResponse.status.should.equal(200)
  })
})