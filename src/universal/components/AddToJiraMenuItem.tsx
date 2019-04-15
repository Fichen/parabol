import React, {forwardRef} from 'react'
import styled from 'react-emotion'
import MenuItem from 'universal/components/MenuItem'
import MenuItemLabel from 'universal/components/MenuItemLabel'
import useAtmosphere from 'universal/hooks/useAtmosphere'
import {IntegrationServiceEnum} from 'universal/types/graphql'
import handleOpenOAuth from 'universal/utils/handleOpenOAuth'
import withMutationProps, {WithMutationProps} from 'universal/utils/relay/withMutationProps'

interface Props extends WithMutationProps {
  teamId: string
}

const Jira = styled('div')({
  alignItems: 'center',
  display: 'flex',
  width: 24,
  height: 24,
  marginRight: 12
})

const AddToGitHubMenuItem = forwardRef((props: Props, ref) => {
  const {teamId, submitting, submitMutation, onError, onCompleted} = props
  const atmosphere = useAtmosphere()
  return (
    <MenuItem
      ref={ref}
      label={
        <MenuItemLabel>
          <Jira>
            <svg
              width='20px'
              height='20px'
              viewBox='0 0 256 256'
              version='1.1'
              preserveAspectRatio='xMidYMid'
            >
              <defs>
                <linearGradient
                  x1='98.0308675%'
                  y1='0.160599572%'
                  x2='58.8877062%'
                  y2='40.7655246%'
                  id='linearGradient-1'
                >
                  <stop stop-color='#0052CC' offset='18%' />
                  <stop stop-color='#2684FF' offset='100%' />
                </linearGradient>
                <linearGradient
                  x1='100.665247%'
                  y1='0.45503212%'
                  x2='55.4018095%'
                  y2='44.7269807%'
                  id='linearGradient-2'
                >
                  <stop stop-color='#0052CC' offset='18%' />
                  <stop stop-color='#2684FF' offset='100%' />
                </linearGradient>
              </defs>
              <g>
                <path
                  d='M244.657778,0 L121.706667,0 C121.706667,14.7201046 127.554205,28.837312 137.962891,39.2459977 C148.371577,49.6546835 162.488784,55.5022222 177.208889,55.5022222 L199.857778,55.5022222 L199.857778,77.3688889 C199.877391,107.994155 224.699178,132.815943 255.324444,132.835556 L255.324444,10.6666667 C255.324444,4.77562934 250.548815,3.60722001e-16 244.657778,0 Z'
                  fill='#2684FF'
                />
                <path
                  d='M183.822222,61.2622222 L60.8711111,61.2622222 C60.8907238,91.8874888 85.7125112,116.709276 116.337778,116.728889 L138.986667,116.728889 L138.986667,138.666667 C139.025905,169.291923 163.863607,194.097803 194.488889,194.097778 L194.488889,71.9288889 C194.488889,66.0378516 189.71326,61.2622222 183.822222,61.2622222 Z'
                  fill='url(#linearGradient-1)'
                />
                <path
                  d='M122.951111,122.488889 L0,122.488889 C3.75391362e-15,153.14192 24.8491913,177.991111 55.5022222,177.991111 L78.2222222,177.991111 L78.2222222,199.857778 C78.241767,230.45532 103.020285,255.265647 133.617778,255.324444 L133.617778,133.155556 C133.617778,127.264518 128.842148,122.488889 122.951111,122.488889 Z'
                  fill='url(#linearGradient-2)'
                />
              </g>
            </svg>
          </Jira>
          {'Add Jira integration'}
        </MenuItemLabel>
      }
      onClick={handleOpenOAuth({
        name: IntegrationServiceEnum.atlassian,
        submitting,
        submitMutation,
        atmosphere,
        onError,
        onCompleted,
        teamId
      })}
    />
  )
})

export default withMutationProps(AddToGitHubMenuItem)
