import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import React, { Suspense } from 'react'
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router'
import { Observable } from 'rxjs'
import { ActivationProps } from '../../shared/src/components/activation/Activation'
import { FetchFileCtx } from '../../shared/src/components/CodeExcerpt'
import { ExtensionsControllerProps } from '../../shared/src/extensions/controller'
import * as GQL from '../../shared/src/graphql/schema'
import { ResizablePanel } from '../../shared/src/panel/Panel'
import { PlatformContextProps } from '../../shared/src/platform/context'
import { SettingsCascadeProps } from '../../shared/src/settings/settings'
import { ErrorLike } from '../../shared/src/util/errors'
import { parseHash } from '../../shared/src/util/url'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalContributions } from './contributions'
import { ExploreSectionDescriptor } from './explore/ExploreArea'
import { ExtensionAreaRoute } from './extensions/extension/ExtensionArea'
import { ExtensionAreaHeaderNavItem } from './extensions/extension/ExtensionAreaHeader'
import { ExtensionsAreaRoute } from './extensions/ExtensionsArea'
import { ExtensionsAreaHeaderActionButton } from './extensions/ExtensionsAreaHeader'
import { GlobalAlerts } from './global/GlobalAlerts'
import { GlobalDebug } from './global/GlobalDebug'
import { KeybindingsProps } from './keybindings'
import { IntegrationsToast } from './marketing/IntegrationsToast'
import { GlobalNavbar } from './nav/GlobalNavbar'
import { OrgAreaRoute } from './org/area/OrgArea'
import { OrgAreaHeaderNavItem } from './org/area/OrgHeader'
import { fetchHighlightedFileLines } from './repo/backend'
import { RepoContainerRoute } from './repo/RepoContainer'
import { RepoHeaderActionButton } from './repo/RepoHeader'
import { RepoRevContainerRoute } from './repo/RepoRevContainer'
import { LayoutRouteProps } from './routes'
import { parseSearchURLQuery } from './search'
import { SiteAdminAreaRoute } from './site-admin/SiteAdminArea'
import { SiteAdminSideBarGroups } from './site-admin/SiteAdminSidebar'
import { ThemePreferenceProps, ThemeProps } from './theme'
import { EventLogger, EventLoggerProps } from './tracking/eventLogger'
import { UserAreaRoute } from './user/area/UserArea'
import { UserAreaHeaderNavItem } from './user/area/UserAreaHeader'
import { UserSettingsAreaRoute } from './user/settings/UserSettingsArea'
import { UserSettingsSidebarItems } from './user/settings/UserSettingsSidebar'
import { parseBrowserRepoURL } from './util/url'

export interface LayoutProps
    extends RouteComponentProps<any>,
        SettingsCascadeProps,
        PlatformContextProps,
        ExtensionsControllerProps,
        KeybindingsProps,
        ThemeProps,
        EventLoggerProps,
        ThemePreferenceProps,
        ActivationProps {
    exploreSections: ReadonlyArray<ExploreSectionDescriptor>
    extensionAreaRoutes: ReadonlyArray<ExtensionAreaRoute>
    extensionAreaHeaderNavItems: ReadonlyArray<ExtensionAreaHeaderNavItem>
    extensionsAreaRoutes: ReadonlyArray<ExtensionsAreaRoute>
    extensionsAreaHeaderActionButtons: ReadonlyArray<ExtensionsAreaHeaderActionButton>
    siteAdminAreaRoutes: ReadonlyArray<SiteAdminAreaRoute>
    siteAdminSideBarGroups: SiteAdminSideBarGroups
    siteAdminOverviewComponents: ReadonlyArray<React.ComponentType>
    userAreaHeaderNavItems: ReadonlyArray<UserAreaHeaderNavItem>
    userAreaRoutes: ReadonlyArray<UserAreaRoute>
    userSettingsSideBarItems: UserSettingsSidebarItems
    userSettingsAreaRoutes: ReadonlyArray<UserSettingsAreaRoute>
    orgAreaHeaderNavItems: ReadonlyArray<OrgAreaHeaderNavItem>
    orgAreaRoutes: ReadonlyArray<OrgAreaRoute>
    repoContainerRoutes: ReadonlyArray<RepoContainerRoute>
    repoRevContainerRoutes: ReadonlyArray<RepoRevContainerRoute>
    repoHeaderActionButtons: ReadonlyArray<RepoHeaderActionButton>
    routes: ReadonlyArray<LayoutRouteProps>

    authenticatedUser: GQL.IUser | null

    /**
     * The subject GraphQL node ID of the viewer, which is used to look up the viewer's settings. This is either
     * the site's GraphQL node ID (for anonymous users) or the authenticated user's GraphQL node ID.
     */
    viewerSubject: Pick<GQL.ISettingsSubject, 'id' | 'viewerCanAdminister'>

    telemetryService: EventLogger

    // Search
    navbarSearchQuery: string
    onNavbarQueryChange: (query: string) => void
    fetchHighlightedFileLines: (ctx: FetchFileCtx, force?: boolean) => Observable<string[]>
    searchRequest: (
        query: string,
        { extensionsController }: ExtensionsControllerProps<'services'>
    ) => Observable<GQL.ISearchResults | ErrorLike>

    isSourcegraphDotCom: boolean

    children?: never
}

export const Layout: React.FunctionComponent<LayoutProps> = props => {
    const isSearchHomepage = props.location.pathname === '/search' && !parseSearchURLQuery(props.location.search)

    const needsSiteInit = window.context.showOnboarding
    const isSiteInit = props.location.pathname === '/site-admin/init'

    // Remove trailing slash (which is never valid in any of our URLs).
    if (props.location.pathname !== '/' && props.location.pathname.endsWith('/')) {
        return <Redirect to={{ ...props.location, pathname: props.location.pathname.slice(0, -1) }} />
    }

    return (
        <div className="layout">
            <GlobalAlerts
                isSiteAdmin={!!props.authenticatedUser && props.authenticatedUser.siteAdmin}
                settingsCascade={props.settingsCascade}
            />
            {!needsSiteInit && !isSiteInit && !!props.authenticatedUser && (
                <IntegrationsToast history={props.history} />
            )}
            {!isSiteInit && <GlobalNavbar {...props} lowProfile={isSearchHomepage} />}
            {needsSiteInit && !isSiteInit && <Redirect to="/site-admin/init" />}
            <ErrorBoundary location={props.location}>
                <Suspense fallback={<LoadingSpinner className="icon-inline m-2" />}>
                    <Switch>
                        {props.routes.map(({ render, ...route }) => {
                            const isFullWidth = !route.forceNarrowWidth
                            return (
                                <Route
                                    {...route}
                                    key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                    component={undefined}
                                    // tslint:disable-next-line:jsx-no-lambda
                                    render={routeComponentProps => (
                                        <div
                                            className={[
                                                'layout__app-router-container',
                                                `layout__app-router-container--${
                                                    isFullWidth ? 'full-width' : 'restricted'
                                                }`,
                                            ].join(' ')}
                                        >
                                            {render({ ...props, ...routeComponentProps })}
                                        </div>
                                    )}
                                />
                            )
                        })}
                    </Switch>
                </Suspense>
            </ErrorBoundary>
            {parseHash(props.location.hash).viewState && props.location.pathname !== '/sign-in' && (
                <ResizablePanel
                    {...props}
                    repoName={`git://${parseBrowserRepoURL(props.location.pathname).repoName}`}
                    fetchHighlightedFileLines={fetchHighlightedFileLines}
                />
            )}
            <GlobalContributions
                key={3}
                extensionsController={props.extensionsController}
                platformContext={props.platformContext}
                history={props.history}
            />
            <GlobalDebug {...props} />
        </div>
    )
}
