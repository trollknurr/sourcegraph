import { Shortcut, ShortcutProps } from '@slimsag/react-shortcuts'
import * as H from 'history'
import React from 'react'
import { Link } from 'react-router-dom'
import { ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap'
import * as GQL from '../../../shared/src/graphql/schema'
import { ThemePreference, ThemePreferenceProps, ThemeProps } from '../theme'
import { UserAvatar } from '../user/UserAvatar'

interface Props extends ThemeProps, ThemePreferenceProps {
    location: H.Location
    authenticatedUser: GQL.IUser
    showDotComMarketing: boolean
    showDiscussions: boolean
    switchThemeKeybinding?: Pick<ShortcutProps, 'held' | 'ordered'>[]
}

interface State {
    isOpen: boolean
}

/**
 * Displays the user's avatar and/or username in the navbar and exposes a dropdown menu with more options for
 * authenticated viewers.
 */
export class UserNavItem extends React.PureComponent<Props, State> {
    private supportsSystemTheme =
        !!window.matchMedia && window.matchMedia('not all and (prefers-color-scheme), (prefers-color-scheme)').matches
    public state: State = { isOpen: false }

    public componentDidUpdate(prevProps: Props): void {
        // Close dropdown after clicking on a dropdown item.
        if (this.state.isOpen && this.props.location !== prevProps.location) {
            this.setState({ isOpen: false })
        }
    }

    public render(): JSX.Element | null {
        return (
            <ButtonDropdown isOpen={this.state.isOpen} toggle={this.toggleIsOpen} className="py-0">
                <DropdownToggle
                    caret={true}
                    className="bg-transparent d-flex align-items-center e2e-user-nav-item-toggle"
                    nav={true}
                >
                    {this.props.authenticatedUser.avatarURL ? (
                        <UserAvatar user={this.props.authenticatedUser} size={48} className="icon-inline" />
                    ) : (
                        <strong>{this.props.authenticatedUser.username}</strong>
                    )}
                </DropdownToggle>
                <DropdownMenu right={true} className="user-nav-item__dropdown-menu">
                    <DropdownItem header={true} className="py-1">
                        Signed in as <strong>@{this.props.authenticatedUser.username}</strong>
                    </DropdownItem>
                    <DropdownItem divider={true} />
                    <Link to={this.props.authenticatedUser.settingsURL!} className="dropdown-item">
                        Settings
                    </Link>
                    <Link to="/extensions" className="dropdown-item">
                        Extensions
                    </Link>
                    {this.props.showDiscussions && (
                        <Link to="/discussions" className="dropdown-item">
                            Discussions
                        </Link>
                    )}
                    <Link to={`/users/${this.props.authenticatedUser.username}/searches`} className="dropdown-item">
                        Saved searches
                    </Link>
                    <DropdownItem divider={true} />
                    <div className="px-2 py-1">
                        <div className="d-flex align-items-center">
                            <div className="mr-2">Theme</div>
                            {/* tslint:disable-next-line: jsx-ban-elements <Select> doesn't support small version */}
                            <select
                                className="custom-select custom-select-sm e2e-theme-toggle"
                                onChange={this.onThemeChange}
                                value={this.props.themePreference}
                            >
                                <option value={ThemePreference.Light}>Light</option>
                                <option value={ThemePreference.Dark}>Dark</option>
                                <option value={ThemePreference.System}>System</option>
                            </select>
                        </div>
                        {this.props.themePreference === ThemePreference.System && !this.supportsSystemTheme && (
                            <div className="text-wrap">
                                <small>
                                    <a
                                        href="https://caniuse.com/#feat=prefers-color-scheme"
                                        className="text-warning"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        Your browser does not support the system theme.
                                    </a>
                                </small>
                            </div>
                        )}
                        {this.props.switchThemeKeybinding &&
                            this.props.switchThemeKeybinding.map((keybinding, i) => (
                                <Shortcut key={i} {...keybinding} onMatch={this.onThemeCycle} />
                            ))}
                    </div>
                    {this.props.authenticatedUser.organizations.nodes.length > 0 && (
                        <>
                            <DropdownItem divider={true} />
                            <DropdownItem header={true}>Organizations</DropdownItem>
                            {this.props.authenticatedUser.organizations.nodes.map(org => (
                                <Link key={org.id} to={org.settingsURL || org.url} className="dropdown-item">
                                    {org.displayName || org.name}
                                </Link>
                            ))}
                        </>
                    )}
                    <DropdownItem divider={true} />
                    {this.props.authenticatedUser.siteAdmin && (
                        <Link to="/site-admin" className="dropdown-item">
                            Site admin
                        </Link>
                    )}
                    {this.props.showDotComMarketing ? (
                        <a href="https://docs.sourcegraph.com" target="_blank" className="dropdown-item">
                            Help
                        </a>
                    ) : (
                        <Link to="/help" className="dropdown-item">
                            Help
                        </Link>
                    )}
                    {this.props.authenticatedUser.session && this.props.authenticatedUser.session.canSignOut && (
                        <a href="/-/sign-out" className="dropdown-item">
                            Sign out
                        </a>
                    )}
                    {this.props.showDotComMarketing && (
                        <>
                            <DropdownItem divider={true} />
                            <a href="https://about.sourcegraph.com" target="_blank" className="dropdown-item">
                                About Sourcegraph
                            </a>
                        </>
                    )}
                </DropdownMenu>
            </ButtonDropdown>
        )
    }

    private toggleIsOpen = () => this.setState(prevState => ({ isOpen: !prevState.isOpen }))

    private onThemeChange: React.ChangeEventHandler<HTMLSelectElement> = event => {
        this.props.onThemePreferenceChange(event.target.value as ThemePreference)
    }

    private onThemeCycle = () => {
        this.props.onThemePreferenceChange(
            this.props.themePreference === ThemePreference.Dark ? ThemePreference.Light : ThemePreference.Dark
        )
    }
}
