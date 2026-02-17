import type { IOperationResult } from '@microsoft/power-apps/data'
import type { GraphUser_V1 } from '@/generated/models/Office365UsersModel'
import { Office365UsersService } from '@/generated/services/Office365UsersService'
import {
  resolveDataMode,
  type DataMode,
} from '@/services/api-client/environment'

export interface UserIdentity {
  id: string
  displayName: string
}

export interface IdentityServiceDependencies {
  getDataMode?: () => DataMode
  office365UsersService?: {
    MyProfile_V2: ($select?: string) => Promise<IOperationResult<GraphUser_V1>>
  }
  mockIdentity?: UserIdentity
}

const DEFAULT_MOCK_IDENTITY: UserIdentity = {
  id: '00000000-0000-0000-0000-000000000001',
  displayName: 'Mock Employee',
}

export class IdentityService {
  private readonly getDataMode: () => DataMode
  private readonly office365UsersService: {
    MyProfile_V2: ($select?: string) => Promise<IOperationResult<GraphUser_V1>>
  }
  private readonly mockIdentity: UserIdentity
  private cachedIdentity: UserIdentity | null = null

  public constructor(dependencies: IdentityServiceDependencies = {}) {
    this.getDataMode = dependencies.getDataMode ?? resolveDataMode
    this.office365UsersService =
      dependencies.office365UsersService ?? Office365UsersService
    this.mockIdentity = dependencies.mockIdentity ?? DEFAULT_MOCK_IDENTITY
  }

  public async getCurrentUser(): Promise<UserIdentity> {
    if (this.getDataMode() === 'mock') {
      return this.mockIdentity
    }

    if (this.cachedIdentity) {
      return this.cachedIdentity
    }

    let profileResult: IOperationResult<GraphUser_V1>
    try {
      profileResult =
        await this.office365UsersService.MyProfile_V2('id,displayName')
    } catch (error) {
      console.error(
        '[IdentityService] Office 365 Users connector call failed:',
        error,
      )
      throw new Error(
        'Unable to resolve current user identity. The Office 365 Users connector may not be available. Check that the connection is authorized in Power Apps.',
      )
    }

    if (profileResult.success === false) {
      console.error(
        '[IdentityService] MyProfile_V2 returned success=false:',
        profileResult.error,
      )
      throw new Error(
        'Office 365 Users connector returned an error. Verify the connection reference is active.',
      )
    }

    const profile = profileResult.data

    if (!profile?.id || !profile.displayName) {
      console.error(
        '[IdentityService] MyProfile_V2 returned incomplete profile:',
        profile,
      )
      throw new Error('Unable to resolve current user identity from Entra ID.')
    }

    this.cachedIdentity = {
      id: profile.id,
      displayName: profile.displayName,
    }

    console.info(
      '[IdentityService] Resolved identity:',
      this.cachedIdentity.displayName,
    )

    return this.cachedIdentity
  }
}

export const identityService = new IdentityService()
