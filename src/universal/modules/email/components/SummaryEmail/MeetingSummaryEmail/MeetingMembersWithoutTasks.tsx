import React from 'react'
import {RETROSPECTIVE} from 'universal/utils/constants'
import {createFragmentContainer, graphql} from 'react-relay'
import {MeetingMembersWithoutTasks_meeting} from '__generated__/MeetingMembersWithoutTasks_meeting.graphql'
import SummaryAvatarHeader from 'universal/modules/email/components/SummaryEmail/MeetingSummaryEmail/SummaryAvatarHeader'
import useEmailItemGrid from 'universal/hooks/useEmailItemGrid'
import EmailBorderBottom from 'universal/modules/email/components/SummaryEmail/MeetingSummaryEmail/EmailBorderBottom'
import {
  FONT_FAMILY,
  PALETTE_TEXT_MAIN
} from 'universal/modules/email/components/SummaryEmail/MeetingSummaryEmail/constants'

const headerStyle = {
  color: PALETTE_TEXT_MAIN,
  fontFamily: FONT_FAMILY,
  fontSize: 18,
  fontWeight: 600,
  paddingBottom: 24,
  paddingTop: 24
}

const getHeaderText = (meetingType) => {
  switch (meetingType) {
    case RETROSPECTIVE:
      return 'No New Tasks…'
    default:
      return 'No Done or New Tasks…'
  }
}

interface Props {
  meeting: MeetingMembersWithoutTasks_meeting
}

const MeetingMembersWithoutTasks = (props: Props) => {
  const {meeting} = props
  const {meetingMembers, meetingType} = meeting
  // const meetingMembers = new Array(7).fill(mock)
  if (meetingMembers.length === 0) return null
  const grid = useEmailItemGrid(meetingMembers, 4)
  return (
    <>
      <tr>
        <td align='center' style={headerStyle}>
          {getHeaderText(meetingType)}
        </td>
      </tr>
      <tr>
        <td>
          {grid((item) => (
            <SummaryAvatarHeader key={item.id} meetingMember={item} />
          ))}
        </td>
      </tr>
      <EmailBorderBottom />
    </>
  )
}

export default createFragmentContainer(
  MeetingMembersWithoutTasks,
  graphql`
    fragment MeetingMembersWithoutTasks_meeting on NewMeeting {
      meetingType
      meetingMembers {
        ...SummaryAvatarHeader_meetingMember
        id
        isCheckedIn
        user {
          rasterPicture
        }
      }
    }
  `
)
