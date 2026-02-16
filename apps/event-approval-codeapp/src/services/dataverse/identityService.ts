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

    const profileResult = await this.office365UsersService.MyProfile_V2(
      'id,displayName',
    )

    const profile = profileResult.data

    if (!profile?.id || !profile.displayName) {
      throw new Error('Unable to resolve current user identity from Entra ID.')
    }

    return {
      id: profile.id,
      displayName: profile.displayName,
    }
  }
}

export const identityService = new IdentityService()
