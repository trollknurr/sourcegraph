import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import * as H from 'history'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import * as React from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { HeroPage } from '../../components/HeroPage'
import { SettingsArea } from '../../settings/SettingsArea'
import { SiteAdminAlert } from '../../site-admin/SiteAdminAlert'
import { ThemeProps } from '../../theme'
import { OrgAreaPageProps } from '../area/OrgArea'
import { OrgSettingsSidebar } from './OrgSettingsSidebar'
import { OrgSettingsProfilePage } from './profile/OrgSettingsProfilePage'

const NotFoundPage = () => (
    <HeroPage
        icon={MapSearchIcon}
        title="404: Not Found"
        subtitle="Sorry, the requested organization page was not found."
    />
)

interface Props extends OrgAreaPageProps, RouteComponentProps<{}>, ThemeProps {
    location: H.Location
}

/**
 * Renders a layout of a sidebar and a content area to display pages related to
 * an organization's settings.
 */
export const OrgSettingsArea: React.FunctionComponent<Props> = props => {
    if (!props.authenticatedUser) {
        return null
    }
    return (
        <div className="d-flex">
            <OrgSettingsSidebar {...props} className="flex-0 mr-3" />
            <div className="flex-1">
                <ErrorBoundary location={props.location}>
                    <React.Suspense fallback={<LoadingSpinner className="icon-inline m-2" />}>
                        <Switch>
                            <Route
                                path={props.match.path}
                                key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                exact={true}
                                // tslint:disable-next-line:jsx-no-lambda
                                render={routeComponentProps => (
                                    <SettingsArea
                                        {...routeComponentProps}
                                        {...props}
                                        subject={props.org}
                                        isLightTheme={props.isLightTheme}
                                        extraHeader={
                                            <>
                                                {props.authenticatedUser &&
                                                    props.org.viewerCanAdminister &&
                                                    !props.org.viewerIsMember && (
                                                        <SiteAdminAlert className="sidebar__alert">
                                                            Viewing settings for <strong>{props.org.name}</strong>
                                                        </SiteAdminAlert>
                                                    )}
                                                <p>
                                                    Organization settings apply to all members. User settings override
                                                    organization settings.
                                                </p>
                                            </>
                                        }
                                    />
                                )}
                            />
                            <Route
                                path={`${props.match.path}/profile`}
                                key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                exact={true}
                                // tslint:disable-next-line:jsx-no-lambda
                                render={routeComponentProps => (
                                    <OrgSettingsProfilePage {...routeComponentProps} {...props} />
                                )}
                            />
                            <Route component={NotFoundPage} />
                        </Switch>
                    </React.Suspense>
                </ErrorBoundary>
            </div>
        </div>
    )
}
