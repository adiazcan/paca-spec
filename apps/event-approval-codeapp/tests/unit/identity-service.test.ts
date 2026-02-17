import { describe, expect, it, vi } from 'vitest'
import { IdentityService } from '@/services/dataverse/identityService'

describe('identity service', () => {
  it('T035 returns default mock user in mock mode', async () => {
    const myProfile = vi.fn()

    const service = new IdentityService({
      getDataMode: () => 'mock',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    const user = await service.getCurrentUser()

    expect(user).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      displayName: 'Mock Employee',
    })
    expect(myProfile).not.toHaveBeenCalled()
  })

  it('T035 calls Office365UsersService.MyProfile_V2 in dataverse mode', async () => {
    const myProfile = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'entra-user-123',
        displayName: 'Alex Approver',
      },
    })

    const service = new IdentityService({
      getDataMode: () => 'dataverse',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    const user = await service.getCurrentUser()

    expect(myProfile).toHaveBeenCalledTimes(1)
    expect(myProfile).toHaveBeenCalledWith('id,displayName')
    expect(user).toEqual({
      id: 'entra-user-123',
      displayName: 'Alex Approver',
    })
  })

  it('caches identity after first successful call', async () => {
    const myProfile = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'entra-user-123',
        displayName: 'Alex Approver',
      },
    })

    const service = new IdentityService({
      getDataMode: () => 'dataverse',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    const user1 = await service.getCurrentUser()
    const user2 = await service.getCurrentUser()

    expect(myProfile).toHaveBeenCalledTimes(1)
    expect(user1).toEqual(user2)
  })

  it('throws descriptive error when connector call fails', async () => {
    const myProfile = vi.fn().mockRejectedValue(new Error('Network timeout'))

    const service = new IdentityService({
      getDataMode: () => 'dataverse',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    await expect(service.getCurrentUser()).rejects.toThrow(
      'Unable to resolve current user identity. The Office 365 Users connector may not be available.',
    )
  })

  it('throws when connector returns success=false', async () => {
    const myProfile = vi.fn().mockResolvedValue({
      success: false,
      error: 'Connection not authorized',
    })

    const service = new IdentityService({
      getDataMode: () => 'dataverse',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    await expect(service.getCurrentUser()).rejects.toThrow(
      'Office 365 Users connector returned an error.',
    )
  })

  it('throws when profile data is incomplete in dataverse mode', async () => {
    const myProfile = vi.fn().mockResolvedValue({
      data: {
        id: '',
        displayName: '',
      },
    })

    const service = new IdentityService({
      getDataMode: () => 'dataverse',
      office365UsersService: {
        MyProfile_V2: myProfile,
      },
    })

    await expect(service.getCurrentUser()).rejects.toThrow(
      'Unable to resolve current user identity from Entra ID.',
    )
  })
})
