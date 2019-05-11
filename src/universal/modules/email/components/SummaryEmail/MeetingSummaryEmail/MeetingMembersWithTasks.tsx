import React from 'react'
import {createFragmentContainer, graphql} from 'react-relay'
import MeetingMemberTaskSummaryList from 'universal/modules/email/components/SummaryEmail/MeetingSummaryEmail/MeetingMemberTaskSummaryList'
import {MeetingMembersWithTasks_meeting} from '__generated__/MeetingMembersWithTasks_meeting.graphql'
import EmailBorderBottom from 'universal/modules/email/components/SummaryEmail/MeetingSummaryEmail/EmailBorderBottom'

interface Props {
  meeting: MeetingMembersWithTasks_meeting
}

const MeetingMembersWithTasks = (props: Props) => {
  const {meeting} = props
  const {meetingMembers} = meeting
  const meetingMembersWithTasks = meetingMembers.filter(
    ({doneTasks, tasks}) => (tasks ? tasks.length : 0) + (doneTasks ? doneTasks.length : 0) > 0
  )
  if (meetingMembersWithTasks.length === 0) return null
  return (
    <>
      {meetingMembersWithTasks.map((member) => (
        <MeetingMemberTaskSummaryList meetingMember={member} key={member.id} />
      ))}
      <EmailBorderBottom />
    </>
  )
}

export default createFragmentContainer(
  MeetingMembersWithTasks,
  graphql`
    fragment MeetingMembersWithTasks_meeting on NewMeeting {
      meetingMembers {
        id
        ...MeetingMemberTaskSummaryList_meetingMember
        ... on ActionMeetingMember {
          doneTasks {
            id
          }
          tasks {
            id
          }
        }
        ... on RetrospectiveMeetingMember {
          tasks {
            id
          }
        }
      }
    }
  `
)
