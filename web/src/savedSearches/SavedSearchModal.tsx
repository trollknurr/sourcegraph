import * as H from 'history'
import * as React from 'react'
import * as GQL from '../../../shared/src/graphql/schema'
import { Form } from '../components/Form'
import { Select } from '../components/Select'

interface Props {
    location: H.Location
    history: H.History
    authenticatedUser: GQL.IUser | null
    query?: string
    onDidCancel: () => void
}

enum UserOrOrg {
    User = 'User',
    Org = 'Org',
}

interface State {
    saveLocation: UserOrOrg
    organization?: string
}

export class SavedSearchModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            saveLocation: UserOrOrg.User,
        }
    }

    private onLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const locationType = event.target.value
        this.setState({ saveLocation: locationType as UserOrOrg })
    }

    private onOrganizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const orgName = event.target.value
        this.setState({ organization: orgName })
    }

    public render(): JSX.Element | null {
        return (
            this.props.authenticatedUser && (
                <Form onSubmit={this.onSubmit} className="saved-search-modal-form">
                    <h3>Save search query to: </h3>
                    <div className="form-group">
                        <Select onChange={this.onLocationChange} className="saved-search-modal-form__select">
                            <option value={UserOrOrg.User}>User</option>
                            {this.props.authenticatedUser.organizations &&
                                this.props.authenticatedUser.organizations.nodes.length > 0 && (
                                    <option value={UserOrOrg.Org}>Organization</option>
                                )}
                        </Select>
                        {this.props.authenticatedUser.organizations &&
                            this.props.authenticatedUser.organizations.nodes.length > 0 &&
                            this.state.saveLocation === UserOrOrg.Org && (
                                <Select
                                    onChange={this.onOrganizationChange}
                                    placeholder="Select an organization"
                                    className="saved-search-modal-form__select"
                                >
                                    <option value="" disabled={true} selected={true}>
                                        Select an organization
                                    </option>
                                    {this.props.authenticatedUser.organizations.nodes.map(org => (
                                        <option value={org.name}>{org.displayName ? org.displayName : org.name}</option>
                                    ))}
                                </Select>
                            )}
                    </div>
                    <button
                        type="submit"
                        disabled={this.state.saveLocation === UserOrOrg.Org && !this.state.organization}
                        className="btn btn-primary saved-search-modal-form__button"
                    >
                        Save query
                    </button>
                </Form>
            )
        )
    }

    private onSubmit = () => {
        if (this.props.query && this.props.authenticatedUser) {
            const encodedQuery = encodeURIComponent(this.props.query)
            this.props.history.push(
                this.state.saveLocation.toLowerCase() === 'user'
                    ? `/users/${this.props.authenticatedUser.username}/searches/add?query=${encodedQuery}`
                    : `/organizations/${this.state.organization}/searches/add?query=${encodedQuery}`
            )
        }
    }
}
