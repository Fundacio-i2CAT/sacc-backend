require('dotenv').config()

const REQUEST = require('../schemas/accessRequest.js')
const USER = require('./user.js')
const PUBLIC_KEY = require('./../schemas/publicKey.js')
const FCM_NODE = require('fcm-node')
const FCM = new FCM_NODE(process.env.FCM_SERVER_KEY)
const DEVELOPMENT = process.env.DEVELOPMENT

const getAccessRequests = async function (page, limit, endUserAddress, query) {
  const requests = await REQUEST.getAccessRequests(page, limit, endUserAddress, query)
  requests.accessRequests = await Promise.all(
    requests.accessRequests.map(async accessRequest => {
      const publicKey = await PUBLIC_KEY.getPublicKey(accessRequest.researchInstitutionManagerAddress)
      const project = await REQUEST.getProject(accessRequest.project)
      return {
        publicKey: publicKey,
        encryptedPassword: accessRequest.encryptedPassword,
        researchInstitutionManagerAddress:
        accessRequest.researchInstitutionManagerAddress,
        endUserAddress: accessRequest.endUserAddress,
        revoked: accessRequest.revoked,
        granted: accessRequest.granted,
        rejected: accessRequest.rejected,
        pendingBC: accessRequest.pendingBC,
        project: { title: project.title, description: project.description, address: project.address },
        researchInstitutionManager: await USER.getUser(
          accessRequest.researchInstitutionManagerAddress
        )
      }
    })
  )
  return requests
}

const getProjects = async function (
  page,
  limit,
  researchInstitutionManagerAddress
) {
  const projects = await REQUEST.getProjects(
    page,
    limit,
    researchInstitutionManagerAddress
  )
  projects.projects = await Promise.all(
    projects.projects.map(async project => {
      const grantedAccessRequests = await REQUEST.countGranted(researchInstitutionManagerAddress, project._id)
      const revokedAccessRequests = await REQUEST.countRevoked(researchInstitutionManagerAddress, project._id)
      const pendingAccessRequests = await REQUEST.countPending(researchInstitutionManagerAddress, project._id)
      const rejectedAccessRequests = await REQUEST.countRejected(researchInstitutionManagerAddress, project._id)
      const projectInstance = {
        researchInstitutionManagerAddress:
        project.researchInstitutionManagerAddress,
        title: project.title,
        description: project.description,
        stats: {
          granted: grantedAccessRequests,
          revoked: revokedAccessRequests,
          pending: pendingAccessRequests,
          rejected: rejectedAccessRequests
        },
        researchInstitutionManager: await USER.getUser(
          project.researchInstitutionManagerAddress
        )
      }
      return projectInstance
    })
  )
  return projects
}

const getProject = async function (projectId) {
  return REQUEST.getProject(projectId)
}

const getResearchInstitutionManagerAccessRequests = async function (
  page,
  limit,
  researchInstitutionManagerAddress,
  query
) {
  const requests = await REQUEST.getResearchInstitutionManagerAccessRequests(
    page,
    limit,
    researchInstitutionManagerAddress,
    query
  )
  requests.accessRequests = await Promise.all(
    requests.accessRequests.map(async accessRequest => {
      const project = await REQUEST.getProject(accessRequest.project)
      const accessRequestInstance = {
        researchInstitutionManagerAddress:
        accessRequest.researchInstitutionManagerAddress,
        endUserAddress: accessRequest.endUserAddress,
        revoked: accessRequest.revoked,
        granted: accessRequest.granted,
        project: { title: project.title, description: project.description },
        researchInstitutionManager: await USER.getUser(
          accessRequest.researchInstitutionManagerAddress
        )
      }
      if (!accessRequest.revoked && accessRequest.granted) {
        accessRequestInstance.encryptedPassword = accessRequest.encryptedPassword
        accessRequestInstance.dataUrl = await USER.getDataUrl(accessRequest.endUserAddress)
      }
      return accessRequestInstance
    })
  )
  return requests
}

const getAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectAddress
) {
  const request = await REQUEST.getAccessRequest(
    endUserAddress,
    researchInstitutionManagerAddress,
    projectAddress
  )
  return request
}

const grantAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectAddress
) {
  const request = await REQUEST.getAccessRequest(
    endUserAddress,
    researchInstitutionManagerAddress,
    projectAddress
  )
  request.revoked = false
  request.granted = true
  request.pendingBC = false
  request.save()
}

const revokeAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectAddress
) {
  const request = await REQUEST.getAccessRequest(
    endUserAddress,
    researchInstitutionManagerAddress,
    projectAddress
  )
  request.revoked = true
  request.granted = false
  request.pendingBC = false
  request.encryptedPassword = ''
  request.save()
}

const manageBCAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  encryptedPassword,
  projectAddress
) {
  const request = await REQUEST.getAccessRequest(
    endUserAddress,
    researchInstitutionManagerAddress,
    projectAddress
  )
  request.pendingBC = true
  request.encryptedPassword = encryptedPassword
  request.save()
}

const createAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectId
) {
  try {
    await REQUEST.newAccessRequest(
      endUserAddress,
      researchInstitutionManagerAddress,
      projectId
    )
    const user = await USER.getUser(endUserAddress)
    if (!user.firebaseCloudToken) {
      return
    }
    const researchInstitution = await USER.getUser(researchInstitutionManagerAddress)
    const message = {
      to: user.firebaseCloudToken,
      notification: {
        title: 'Nova sol·licitud d\'accés',
        body: `Enviada per ${researchInstitution.institutionName}`
      }
    }
    const project = await REQUEST.getProject(projectId)
    if (project) {
      if (project.title) {
        message.notification.body += ` en relació al projecte ${project.title};`
      }
      if (project.description) {
        message.notification.body += ` ${project.description}`
      }
    }
    if (!DEVELOPMENT && !user.asleep) {
      FCM.send(message, function (err, response) {
        if (err) {
          console.log(err)
        }
      })
    }
  } catch (error) {
    throw new Error('Unexpected access request error: ' + error)
  }
}

const rejectAccessRequest = async function (address, researchInstitutionManagerAddress) {
  const request = await REQUEST.getAccessRequest(
    address,
    researchInstitutionManagerAddress
  )
  request.revoked = false
  request.granted = false
  request.rejected = true
  request.pendingBC = false
  request.save()
}

const createAccessRequests = async function (researchInstitutionManagerAddress, project) {
  const users = await USER.getUsers(1, 100000000, 'END_USER')
  const projectModel = await REQUEST.newProject(project, researchInstitutionManagerAddress)
  users.users.forEach(async user => {
    // In order to ease integration testing, in development mode this is done synchronously
    if (process.env.DEVELOPMENT) {
      await createAccessRequest(
        user.address,
        researchInstitutionManagerAddress,
        projectModel._id.toString()
      )
    } else {
      createAccessRequest(user.address, researchInstitutionManagerAddress, projectModel._id.toString())
    }
  })
  return projectModel.address
}

module.exports = {
  getAccessRequests: getAccessRequests,
  createAccessRequest: createAccessRequest,
  createAccessRequests: createAccessRequests,
  getAccessRequest: getAccessRequest,
  grantAccessRequest: grantAccessRequest,
  revokeAccessRequest: revokeAccessRequest,
  rejectAccessRequest: rejectAccessRequest,
  getResearchInstitutionManagerAccessRequests: getResearchInstitutionManagerAccessRequests,
  manageBCAccessRequest: manageBCAccessRequest,
  getProjects: getProjects,
  getProject: getProject
}
