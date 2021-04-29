const MONGOOSE = require('mongoose')
const MONGOOSE_PAGINATE = require('mongoose-paginate-v2')
const MONGOOSE_TIMESTAMP = require('mongoose-timestamp')
const SCHEMA = MONGOOSE.Schema

const PROJECT_SCHEMA = new SCHEMA({
  title: { type: String, required: true },
  description: { type: String, required: true },
  researchInstitutionManagerAddress: { type: String, required: true },
  address: { type: String }
})

PROJECT_SCHEMA.plugin(MONGOOSE_PAGINATE)

const ACCESS_REQUEST_SCHEMA = new SCHEMA({
  researchInstitutionManagerAddress: { type: String, required: true },
  endUserAddress: { type: String, required: true },
  granted: { type: Boolean, default: false },
  revoked: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false },
  pendingBC: { type: Boolean, default: false },
  encryptedPassword: { type: SCHEMA.Types.Mixed, default: {} },
  project: { type: MONGOOSE.Schema.Types.ObjectId, ref: 'PROJECT' }
})

ACCESS_REQUEST_SCHEMA.plugin(MONGOOSE_TIMESTAMP)
ACCESS_REQUEST_SCHEMA.plugin(MONGOOSE_PAGINATE)

const PROJECT = MONGOOSE.model('Project', PROJECT_SCHEMA)
const PROJECT_UTILS = require('../utils/project')
const ACCESS_REQUEST = MONGOOSE.model('AccessRequest', ACCESS_REQUEST_SCHEMA)

ACCESS_REQUEST.paginate().then({})
PROJECT.paginate().then({})

const getProject = async function (_id) {
  return PROJECT.findOne({ _id: _id })
}

const getProjects = async function (page, limit, researchInstitutionManagerAddress = null) {
  const options = {
    page: page,
    limit: limit
  }
  let query = {}
  if (researchInstitutionManagerAddress) {
    query = { researchInstitutionManagerAddress: researchInstitutionManagerAddress }
  }
  const projectPagination = await PROJECT.paginate(query, options)
  const projects = {
    projects: await PROJECT.find(query)
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ title: 1 }),
    totalDocs: projectPagination.totalDocs,
    totalPages: projectPagination.totalPages,
    hasPrevPage: projectPagination.hasPrevPage,
    hasNextPage: projectPagination.hasNextPage,
    page: projectPagination.page,
    limit: projectPagination.limit
  }
  return projects
}

const getAccessRequestCount = async function (address) {
  const count = await ACCESS_REQUEST.countDocuments({ endUserAddress: address })
  return count
}

const getAllAccessRequests = async function (endUserAddress) {
  const limit = await getAccessRequestCount(endUserAddress)
  const query = { endUserAddress: endUserAddress, rejected: false }
  return ACCESS_REQUEST.find(query).limit(limit)
}

const revokeAllAccessRequests = async function (
  endUserAddress
) {
  const requests = await getAllAccessRequests(
    endUserAddress.toLowerCase()
  )
  requests.forEach(async function (request) {
    request.revoked = true
    request.granted = false
    request.pendingBC = false
    request.encryptedPassword = ''
    request.save()
  })
}

const getAccessRequests = async function (page, limit, endUserAddress, queryFilter) {
  const options = {
    page: page,
    limit: limit
  }
  const query = { endUserAddress: endUserAddress, rejected: false }
  if (queryFilter) {
    switch (queryFilter.filter) {
      case 'pending':
        query.granted = false
        query.revoked = false
        query.rejected = false
        break
      case 'granted':
        query.granted = true
        break
      case 'revoked':
        query.revoked = true
        break
      case 'rejected':
        query.rejected = true
        break
    }
  }
  const userPagination = await ACCESS_REQUEST.paginate(query, options)
  const accessRequests = {
    accessRequests: await ACCESS_REQUEST.find(query)
      .sort({ project: 1 })
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ researchInstitutionManagerAddress: 1 }),
    totalDocs: userPagination.totalDocs,
    totalPages: userPagination.totalPages,
    hasPrevPage: userPagination.hasPrevPage,
    hasNextPage: userPagination.hasNextPage,
    page: userPagination.page,
    limit: userPagination.limit
  }
  return accessRequests
}

const getResearchInstitutionManagerAccessRequests = async function (
  page,
  limit,
  researchInstitutionManagerAddress,
  queryFilter
) {
  const options = {
    page: page,
    limit: limit
  }
  const query = {
    researchInstitutionManagerAddress: researchInstitutionManagerAddress
  }
  if (queryFilter) {
    switch (queryFilter.filter) {
      case 'pending':
        query.pending = true
        break
      case 'granted':
        query.granted = true
        break
      case 'revoked':
        query.revoked = true
        break
      case 'rejected':
        query.rejected = true
        break
    }
  }
  const userPagination = await ACCESS_REQUEST.paginate(query, options)
  const accessRequests = {
    accessRequests: await ACCESS_REQUEST.find(query)
      .sort({ project: 1 })
      .limit(limit)
      .skip(limit * (page - 1))
      .sort({ endUserAddress: 1 }),
    totalDocs: userPagination.totalDocs,
    totalPages: userPagination.totalPages,
    hasPrevPage: userPagination.hasPrevPage,
    hasNextPage: userPagination.hasNextPage,
    page: userPagination.page,
    limit: userPagination.limit
  }
  return accessRequests
}

const countGranted = async function (researchInstitutionManagerAddress, projectId) {
  const query = {
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    granted: true,
    project: projectId
  }
  return ACCESS_REQUEST.countDocuments(query)
}

const countRevoked = async function (researchInstitutionManagerAddress, projectId) {
  const query = {
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    revoked: true,
    project: projectId
  }
  return ACCESS_REQUEST.countDocuments(query)
}

const countRejected = async function (researchInstitutionManagerAddress, projectId) {
  const query = {
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    rejected: true,
    project: projectId
  }
  return ACCESS_REQUEST.countDocuments(query)
}

const countPending = async function (researchInstitutionManagerAddress, projectId) {
  const query = {
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    revoked: false,
    granted: false,
    rejected: false,
    project: projectId
  }
  return ACCESS_REQUEST.countDocuments(query)
}

const getAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectAddress
) {
  const project = await PROJECT.findOne({ address: projectAddress })
  const query = {
    endUserAddress: endUserAddress,
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    project: project._id
  }
  const accessRequest = await ACCESS_REQUEST.findOne(query)
  return accessRequest
}

const newAccessRequest = async function (
  endUserAddress,
  researchInstitutionManagerAddress,
  projectId
) {
  try {
    const object = {
      researchInstitutionManagerAddress: researchInstitutionManagerAddress,
      endUserAddress: endUserAddress,
      project: projectId
    }
    const model = await ACCESS_REQUEST.create(object)
    return model.id
  } catch (error) {
    throw new Error('Unexpected access request error')
  }
}

const newProject = async function (project, researchInstitutionManagerAddress) {
  const address = await PROJECT_UTILS.createProjectAddress('')
  const projectModel = await PROJECT.create({
    title: project.title,
    description: project.description,
    researchInstitutionManagerAddress: researchInstitutionManagerAddress,
    address
  })
  projectModel.address = await PROJECT_UTILS.createProjectAddress(projectModel._id.toString())
  await projectModel.save()
  return projectModel
}

module.exports = {
  getAccessRequests: getAccessRequests,
  newAccessRequest: newAccessRequest,
  getAccessRequest: getAccessRequest,
  getResearchInstitutionManagerAccessRequests: getResearchInstitutionManagerAccessRequests,
  getProject: getProject,
  newProject: newProject,
  getProjects: getProjects,
  countGranted: countGranted,
  countRevoked: countRevoked,
  countRejected: countRejected,
  countPending: countPending,
  getAllAccessRequests: getAllAccessRequests,
  revokeAllAccessRequests: revokeAllAccessRequests
}
