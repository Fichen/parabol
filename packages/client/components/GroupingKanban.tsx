import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React, {RefObject, useMemo, useState} from 'react'
import {createFragmentContainer} from 'react-relay'
import {GroupingKanban_meeting} from '~/__generated__/GroupingKanban_meeting.graphql'
import useBreakpoint from '../hooks/useBreakpoint'
import useHideBodyScroll from '../hooks/useHideBodyScroll'
import useThrottledEvent from '../hooks/useThrottledEvent'
import {Breakpoint, Times} from '../types/constEnums'
import {NewMeetingPhaseTypeEnum} from '../types/graphql'
import PortalProvider from './AtmosphereProvider/PortalProvider'
import GroupingKanbanColumn from './GroupingKanbanColumn'
import ReflectWrapperMobile from './RetroReflectPhase/ReflectionWrapperMobile'
import ReflectWrapperDesktop from './RetroReflectPhase/ReflectWrapperDesktop'

interface Props {
  meeting: GroupingKanban_meeting
  phaseRef: RefObject<HTMLDivElement>
}

const ColumnsBlock = styled('div')<{isDesktop: boolean}>(({isDesktop}) => ({
  alignItems: 'center',
  display: 'flex',
  flex: '1',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'center',
  margin: '0 auto',
  overflow: 'auto',
  padding: isDesktop ? '0 0 16px' : undefined,
  width: '100%'
}))

export type SwipeColumn = (offset: number) => void

const GroupingKanban = (props: Props) => {
  const {meeting, phaseRef} = props
  const {reflectionGroups, phases} = meeting
  const reflectPhase = phases.find((phase) => phase.phaseType === NewMeetingPhaseTypeEnum.reflect)!
  const reflectPrompts = reflectPhase.reflectPrompts!
  useHideBodyScroll()
  const groupsByPhaseItem = useMemo(() => {
    const container = {} as {[phaseItemId: string]: typeof reflectionGroups[0][]}
    for (let i = 0; i < reflectionGroups.length; i++) {
      const group = reflectionGroups[i]
      const {retroPhaseItemId} = group
      container[retroPhaseItemId] = container[retroPhaseItemId] || []
      container[retroPhaseItemId].push(group)
    }
    return container
  }, [reflectionGroups])
  const isDesktop = useBreakpoint(Breakpoint.SINGLE_REFLECTION_COLUMN)
  const [activeIdx, setActiveIdx] = useState(0)
  const ColumnWrapper = isDesktop ? ReflectWrapperDesktop : ReflectWrapperMobile
  const isViewerDragging = useMemo(() => {
    return isDesktop
      ? false
      : !!reflectionGroups.find((group) =>
          group.reflections.find((reflection) => reflection.isViewerDragging)
        )
  }, [isDesktop, reflectionGroups])
  const swipeColumn: SwipeColumn = useThrottledEvent((offset: number) => {
    const nextIdx = Math.min(reflectPrompts.length - 1, Math.max(0, activeIdx + offset))
    setActiveIdx(nextIdx)
  }, Times.REFLECTION_COLUMN_SWIPE_THRESH)
  return (
    <PortalProvider>
      <ColumnsBlock isDesktop={isDesktop}>
        <ColumnWrapper
          setActiveIdx={setActiveIdx}
          activeIdx={activeIdx}
          disabled={isViewerDragging}
        >
          {reflectPrompts.map((prompt) => (
            <GroupingKanbanColumn
              isDesktop={isDesktop}
              key={prompt.id}
              meeting={meeting}
              phaseRef={phaseRef}
              prompt={prompt}
              reflectionGroups={groupsByPhaseItem[prompt.id] || []}
              swipeColumn={swipeColumn}
            />
          ))}
        </ColumnWrapper>
      </ColumnsBlock>
    </PortalProvider>
  )
}

export default createFragmentContainer(GroupingKanban, {
  meeting: graphql`
    fragment GroupingKanban_meeting on RetrospectiveMeeting {
      ...GroupingKanbanColumn_meeting
      phases {
        ... on ReflectPhase {
          phaseType
          reflectPrompts {
            ...GroupingKanbanColumn_prompt
            id
          }
        }
      }
      reflectionGroups {
        ...GroupingKanbanColumn_reflectionGroups
        id
        retroPhaseItemId
        reflections {
          isViewerDragging
        }
      }
    }
  `
})
