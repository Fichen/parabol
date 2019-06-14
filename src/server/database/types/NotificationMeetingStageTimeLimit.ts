import Notification from './Notification'

interface Input {
  meetingId: string
  userIds: string[]
}

export default class NotificationMeetingStageTimeLimit extends Notification {
  meetingId: string
  constructor (input: Input) {
    const {meetingId, userIds} = input
    super({userIds, type: 'MEETING_STAGE_TIME_LIMIT'})
    this.meetingId = meetingId
  }
}
