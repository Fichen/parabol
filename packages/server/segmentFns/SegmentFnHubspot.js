const crypto = require('crypto')
const fetch = require('node-fetch')





















const contactKeys = {
  lastMetAt: 'last_met_at',
  isAnyBillingLeader: 'is_any_billing_leader',
  monthlyStreakCurrent: 'monthly_streak_current',
  monthlyStreakMax: 'monthly_streak_max',
  createdAt: 'joined_at',
  isPatientZero: 'is_patient_zero',
  isRemoved: 'is_user_removed',
  id: 'parabol_id',
  preferredName: 'parabol_preferred_name'
}

const companyKeys = {
  lastMetAt: 'last_met_at',
  userCount: 'user_count',
  activeUserCount: 'active_user_count',
  activeTeamCount: 'active_team_count',
  meetingCount: 'meeting_count',
  monthlyTeamStreakMax: 'monthly_team_streak_max'
}

const queries = {
  'Changed name': `
query ChangedName($userId: ID!) {
  user(userId: $userId) {
    email
    preferredName
  }
}`,
  'Meeting Completed': `
query MeetingCompleted($userIds: [ID!]!, $userId: ID!) {
  company(userId: $userId) {
    meetingCount
    monthlyTeamStreakMax
  }
  users(userIds: $userIds) {
    id
    email
    lastMetAt
    monthlyStreakCurrent
    monthlyStreakMax
  }
}`,
  'Conversion Modal Pay Later Clicked': `
query PayLaterClicked($userId: ID!) {
  user(userId: $userId) {
    email
    payLaterClickCount
  }
}`,
  'New Org': `
query NewOrg($userId: ID!) {
  user(userId: $userId) {
    email
    isAnyBillingLeader
    company {
      activeTeamCount
    }
  }
}`,
  'User Role Billing Leader Granted': `
query BillingLeaderGranted($userId: ID!) {
  user(userId: $userId) {
    email
    isAnyBillingLeader
  }
}`,
  'User Role Billing Leader Revoked': `
query BillingLeaderRevoked($userId: ID!) {
  user(userId: $userId) {
    email
    isAnyBillingLeader
  }
}`,
  'Account Created': `
query AccountCreated($userId: ID!) {
  user(userId: $userId) {
    id
    preferredName
    email
    createdAt
    isPatientZero
    company {
      userCount
      activeUserCount
    }
  }
}`,
  'Account Removed': `
query AccountRemoved($userId: ID!) {
  user(userId: $userId) {
    email
    isRemoved
    company {
      userCount
      activeUserCount
    }
  }
}`,
  'Account Paused': `
query AccountPaused($userId: ID!) {
  user(userId: $userId) {
    email
    company {
      activeUserCount
    }
  }
}`,
  'Account Unpaused': `
query AccountUnpaused($userId: ID!) {
  user(userId: $userId) {
    email
    company {
      activeUserCount
    }
  }
}`,
  'New Team': `
query NewTeam($userId: ID!) {
  user(userId: $userId) {
    email
    company {
      activeTeamCount
    }
  }
}`,
  'Archive Team': `
query ArchiveTeam($userId: ID!) {
  user(userId: $userId) {
    email
    company {
      activeTeamCount
    }
  }
}`
}

const parabolFetch = async (
  query,
  variables,
  payload,
  settings
) => {
  const {parabolToken, timestamp} = payload
  const {segmentFnKey, parabolEndpoint} = settings
  const ts = Math.floor(new Date(timestamp).getTime() / 1000)
  const signature = crypto
    .createHmac('sha256', segmentFnKey)
    .update(parabolToken)
    .digest('base64')
  const authToken = `${ts}.${signature}`
  const res = await fetch(parabolEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  })
  if (!String(res.status).startsWith('2')) {
    console.log({query, variables: JSON.stringify(variables)})
    throw new Error(`ParabolFetch: ${res.status}`)
  }
  const resJSON = await res.json()
  const {data, errors} = resJSON
  if (errors) {
    throw new Error(errors[0].message)
  }
  return data
}

const normalize = (value) => {
  if (typeof value === 'string' && new Date(value).toJSON() === value) {
    return new Date(value).getTime()
  }
  return value
}

const upsertHubspotContact = async (
  email,
  hapiKey,
  propertiesObj
) => {
  if (!propertiesObj || Object.keys(propertiesObj).length === 0) return
  const res = await fetch(
    `https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/${email}/?hapikey=${hapiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: Object.keys(propertiesObj).map((key) => ({
          property: contactKeys[key],
          value: normalize(propertiesObj[key])
        }))
      })
    }
  )
  if (!String(res.status).startsWith('2')) {
    throw new Error(`upsertFail: ${res.status}: ${email}`)
  }
}

const updateHubspotBulkContact = async (records, hapiKey) => {
  if (!records || Object.keys(records).length === 0) return
  const body = JSON.stringify(
    records.map((record) => {
      const {id, email, ...props} = record
      return {
        email,
        properties: Object.keys(props).map((key) => ({
          property: contactKeys[key],
          value: normalize(props[key])
        }))
      }
    })
  )
  const res = await fetch(`https://api.hubapi.com/contacts/v1/contact/batch/?hapikey=${hapiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  })
  if (!String(res.status).startsWith('2')) {
    throw new Error(`${res.status}: ${body}`)
  }
}

const updateHubspotCompany = async (
  email,
  hapiKey,
  propertiesObj
) => {
  if (!propertiesObj || Object.keys(propertiesObj).length === 0) return
  const url = `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile?hapikey=${hapiKey}&property=associatedcompanyid&property_mode=value_only&formSubmissionMode=none&showListMemberships=false`
  const contactRes = await fetch(url)
  if (!String(contactRes.status).startsWith('2')) {
    throw new Error(`${contactRes.status}: ${email}`)
  }
  const contactResJSON = await contactRes.json()
  const body = JSON.stringify({
    properties: Object.keys(propertiesObj).map((key) => ({
      name: companyKeys[key],
      value: propertiesObj[key]
    }))
  })
  const associatedCompany = contactResJSON['associated-company']
  const companyId = associatedCompany ? associatedCompany['company-id'] : undefined
  if (!companyId) {
    console.log({contact: JSON.stringify(contactResJSON)})
    // force a timeout so segment retries this once hubspot associates a record
    await new Promise((resolve) => setTimeout(resolve, 100000))
  }
  const companyRes = await fetch(
    `https://api.hubapi.com/companies/v2/companies/${companyId}?hapikey=${hapiKey}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    }
  )
  if (!String(companyRes.status).startsWith('2')) {
    throw new Error(`${companyRes.status}: ${body}`)
  }
}

const updateHubspot = async (
  query,
  userId,
  payload,
  settings
) => {
  if (!query) return
  const parabolPayload = await parabolFetch(query, {userId}, payload, settings)
  if (!parabolPayload) return
  const {user} = parabolPayload
  const {email, company, ...contact} = user
  const {hubspotKey} = settings
  await Promise.all([
    upsertHubspotContact(email, hubspotKey, contact),
    updateHubspotCompany(email, hubspotKey, company)
  ])
}

async function onTrack(payload, settings) {
  const {event, userId, properties} = payload
  const {hubspotKey} = settings
  const query = queries[event]
  if (event === 'Meeting Completed') {
    const {userIds} = properties
    if (!userIds) throw new InvalidEventPayload('userIds not provided')
    const parabolPayload = await parabolFetch(query, {userIds, userId}, payload, settings)
    if (!parabolPayload)
      throw new InvalidEventPayload(`Null payload from parabol: ${userIds}, ${userId}, ${query}`)
    const {users, company} = parabolPayload
    const facilitator = users.find((user) => user.id === userId)
    const {email} = facilitator
    await Promise.all([
      updateHubspotBulkContact(users, hubspotKey),
      updateHubspotCompany(email, hubspotKey, company)
    ])
  } else if (event === 'Account Created') {
    const parabolPayload = await parabolFetch(query, {userId}, payload, settings)
    if (!parabolPayload) return
    const {user} = parabolPayload
    const {email, company, ...contact} = user
    const {hubspotKey} = settings
    await upsertHubspotContact(email, hubspotKey, contact)
    // wait for hubspot to associate the contact with the company, fn must run in 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await updateHubspotCompany(email, hubspotKey, company)
  } else {
    // standard handler
    await updateHubspot(query, userId, payload, settings)
  }
}

async function onIdentify() {}

async function onPage() {}


module.exports = onTrack
