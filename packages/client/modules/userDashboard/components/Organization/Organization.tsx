import {Organization_viewer} from '../../../../__generated__/Organization_viewer.graphql'
import React, {lazy, useEffect} from 'react'
import styled from '@emotion/styled'
import Helmet from 'react-helmet'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import Avatar from '../../../../components/Avatar/Avatar'
import DashNavControl from '../../../../components/DashNavControl/DashNavControl'
import EditableAvatar from '../../../../components/EditableAvatar/EditableAvatar'
import EditableOrgName from '../../../../components/EditableOrgName'
import LoadableModal from '../../../../components/LoadableModal'
import SettingsWrapper from '../../../../components/Settings/SettingsWrapper'
import BillingMembersToggle from '../BillingMembersToggle/BillingMembersToggle'
import UserSettingsWrapper from '../UserSettingsWrapper/UserSettingsWrapper'
import defaultOrgAvatar from '../../../../styles/theme/images/avatar-organization.svg'
import OrganizationDetails from './OrganizationDetails'
import OrganizationPage from './OrganizationPage'
import {PALETTE} from '../../../../styles/paletteV2'
import {TierEnum} from '../../../../types/graphql'

const AvatarAndName = styled('div')({
  alignItems: 'flex-start',
  display: 'flex',
  flexShrink: 0,
  margin: '0 auto 16px',
  width: '100%'
})

const OrgNameAndDetails = styled('div')({
  alignItems: 'flex-start',
  color: PALETTE.TEXT_LIGHT,
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  margin: 'auto 0 auto 16px',
  width: '100%'
})

const BackControlBlock = styled('div')({
  margin: '16px 0'
})

const AvatarBlock = styled('div')({
  width: 64
})

const OrgNameBlock = styled('div')({
  color: PALETTE.TEXT_MAIN,
  fontSize: 24,
  lineHeight: '36px'
})

const ToggleNavBlock = styled('div')({
  margin: 0
})

const OrgAvatarInput = lazy(() =>
  import(/* webpackChunkName: 'OrgAvatarInput' */ '../../../../components/OrgAvatarInput')
)

interface Props extends RouteComponentProps<{}> {
  viewer: Organization_viewer
}

const Organization = (props: Props) => {
  const {
    history,
    viewer: {organization}
  } = props
  // trying to be somewhere they shouldn't be, using a Redirect borks the loading animation
  useEffect(() => {
    if (!organization) {
      history.replace('/me')
    }
  }, [history, organization])
  if (!organization) return <div />
  const {orgId, createdAt, isBillingLeader, name: orgName, picture: orgAvatar, tier} = organization
  const pictureOrDefault = orgAvatar || defaultOrgAvatar
  const onlyShowMembers = !isBillingLeader && tier !== TierEnum.personal

  return (
    <UserSettingsWrapper>
      <Helmet title={`Organization Settings | ${orgName}`} />
      <SettingsWrapper narrow>
        <BackControlBlock>
          <DashNavControl
            icon='arrow_back'
            label='Back to Organizations'
            onClick={() => history.push('/me/organizations')}
          />
        </BackControlBlock>
        <AvatarAndName>
          {isBillingLeader ? (
            <LoadableModal
              isToggleNativeElement
              LoadableComponent={OrgAvatarInput}
              queryVars={{picture: pictureOrDefault, orgId}}
              toggle={
                <div>
                  <EditableAvatar hasPanel picture={pictureOrDefault} size={64} unstyled />
                </div>
              }
            />
          ) : (
            <AvatarBlock>
              <Avatar picture={pictureOrDefault} size={64} sansRadius sansShadow />
            </AvatarBlock>
          )}
          <OrgNameAndDetails>
            {isBillingLeader ? (
              <EditableOrgName organization={organization} />
            ) : (
              <OrgNameBlock>{orgName}</OrgNameBlock>
            )}
            <OrganizationDetails createdAt={createdAt} tier={tier as TierEnum} />
          </OrgNameAndDetails>
        </AvatarAndName>
        {!onlyShowMembers && <ToggleNavBlock><BillingMembersToggle orgId={orgId} /></ToggleNavBlock>}
        <OrganizationPage organization={organization} />
      </SettingsWrapper>
    </UserSettingsWrapper>
  )
}

export default createFragmentContainer(withRouter(Organization), {
  viewer: graphql`
    fragment Organization_viewer on User {
      organization(orgId: $orgId) {
        ...EditableOrgName_organization
        ...OrganizationPage_organization
        orgId: id
        isBillingLeader
        createdAt
        name
        orgUserCount {
          activeUserCount
          inactiveUserCount
        }
        picture
        creditCard {
          brand
          expiry
          last4
        }
        periodStart
        periodEnd
        tier
      }
    }
  `
})
