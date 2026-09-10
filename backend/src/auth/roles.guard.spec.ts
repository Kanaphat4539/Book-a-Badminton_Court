import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../users/users.service';

function contextWithUser(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard (unit)', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows the request when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWithUser({ role: UserRole.STUDENT }))).toBe(true);
  });

  it('allows the request when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(contextWithUser({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('denies the request when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(contextWithUser({ role: UserRole.STUDENT }))).toBe(false);
  });
});
