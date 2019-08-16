import {GraphQLNonNull} from 'graphql'
import getRethink from '../../database/rethinkDriver'
import {getUserId, isTeamMember} from '../../utils/authorization'
import CreateReflectionPayload from '../types/CreateReflectionPayload'
import normalizeRawDraftJS from '../../../client/validation/normalizeRawDraftJS'
import publish from '../../utils/publish'
import isPhaseComplete from '../../../client/utils/meetings/isPhaseComplete'
import CreateReflectionInput from '../types/CreateReflectionInput'
import unlockAllStagesForPhase from '../../../client/utils/unlockAllStagesForPhase'
import standardError from '../../utils/standardError'
import {NewMeetingPhaseTypeEnum} from 'parabol-client/types/graphql'
import {SubscriptionChannel} from 'parabol-client/types/constEnums'
import Reflection from '../../database/types/Reflection'
import ReflectionGroup from '../../database/types/ReflectionGroup'
import getReflectionEntities from './helpers/getReflectionEntities'
import extractTextFromDraftString from 'parabol-client/utils/draftjs/extractTextFromDraftString'

export default {
  type: CreateReflectionPayload,
  description: 'Create a new reflection',
  args: {
    input: {
      type: new GraphQLNonNull(CreateReflectionInput)
    }
  },
  async resolve (
    _source,
    {
      input: {content, retroPhaseItemId, sortOrder}
    },
    {authToken, dataLoader, socketId: mutatorId}
  ) {
    const r = getRethink()
    const operationId = dataLoader.share()
    const now = new Date()
    const subOptions = {operationId, mutatorId}

    // AUTH
    const viewerId = getUserId(authToken)
    const phaseItem = await dataLoader.get('customPhaseItems').load(retroPhaseItemId)
    if (!phaseItem) {
      return standardError(new Error('Category not found'), {userId: viewerId})
    }
    if (!phaseItem.isActive) {
      return standardError(new Error('Category not active'), {userId: viewerId})
    }
    const {teamId} = phaseItem
    if (!isTeamMember(authToken, teamId)) {
      return standardError(new Error('Team not found'), {userId: viewerId})
    }
    const team = await dataLoader.get('teams').load(teamId)
    const {meetingId} = team
    const meeting = await r
      .table('NewMeeting')
      .get(meetingId)
      .default(null)
    if (!meeting) return standardError(new Error('Meeting not found'), {userId: viewerId})
    const {endedAt, phases} = meeting
    if (endedAt) return standardError(new Error('Meeting already ended'), {userId: viewerId})
    if (isPhaseComplete(NewMeetingPhaseTypeEnum.reflect, phases)) {
      return standardError(new Error('Meeting phase already completed'), {userId: viewerId})
    }

    // VALIDATION
    const normalizedContent = normalizeRawDraftJS(content)

    // RESOLUTION
    const reflectionGroup = new ReflectionGroup({
      meetingId,
      retroPhaseItemId,
      sortOrder,
    })
    const plaintextContent = extractTextFromDraftString(normalizedContent)
    const entities = await getReflectionEntities(plaintextContent)

    const reflection = new Reflection({
      creatorId: viewerId,
      content: normalizedContent,
      plaintextContent,
      entities,
      meetingId,
      retroPhaseItemId,
      reflectionGroupId: reflectionGroup.id,
      updatedAt: now
    })

    await r({
      group: r.table('RetroReflectionGroup').insert(reflectionGroup),
      reflection: r.table('RetroReflection').insert(reflection)
    })
    const reflections = await dataLoader.get('retroReflectionsByMeetingId').load(meetingId)
    let unlockedStageIds
    if (reflections.length === 1) {
      unlockedStageIds = unlockAllStagesForPhase(phases, NewMeetingPhaseTypeEnum.group, true)
      await r
        .table('NewMeeting')
        .get(meetingId)
        .update({
          phases
        })
    }
    const data = {
      meetingId,
      reflectionId: reflection.id,
      reflectionGroupId: reflectionGroup.id,
      unlockedStageIds
    }
    publish(SubscriptionChannel.TEAM, teamId, CreateReflectionPayload, data, subOptions)
    return data
  }
}