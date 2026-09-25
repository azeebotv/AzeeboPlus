jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagService: jest.fn(),
  realityFlags: {
    votingEnabled: 'reality_voting_enabled',
    predictionsEnabled: 'reality_predictions_enabled',
    liveVoting: 'reality_live_voting',
    autoElimination: 'reality_auto_elimination',
  },
}));

import { JwtService } from '@nestjs/jwt';
import { RealityGateway } from './reality.gateway.js';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('RealityGateway live voting (reality_live_voting)', () => {
  let gateway: RealityGateway;
  let featureFlagService: { isEnabled: jest.Mock };
  let server: { to: jest.Mock };

  const makeClient = (userId?: string) => ({
    id: 'client-1',
    data: { userId },
    handshake: { auth: {}, headers: {}, query: {} },
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(() => {
    featureFlagService = { isEnabled: jest.fn() };
    server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    gateway = new RealityGateway(
      {} as unknown as JwtService,
      featureFlagService as unknown as FeatureFlagService
    );
    gateway.server = server as never;
  });

  it('rejects new_vote with a rejection payload while the flag is off', async () => {
    featureFlagService.isEnabled.mockResolvedValue(false);
    const client = makeClient('user-1');

    await gateway.handleNewVote(client as never, {
      showId: 'show-1',
      contestantId: 'contestant-1',
    });

    expect(featureFlagService.isEnabled).toHaveBeenCalledWith('reality_live_voting');
    expect(client.emit).toHaveBeenCalledWith('vote_update', {
      showId: 'show-1',
      rejected: true,
      reason: 'Live voting is not enabled',
    });
    expect(server.to).not.toHaveBeenCalled();
  });

  it('relays the vote to the show room while the flag is on', async () => {
    featureFlagService.isEnabled.mockResolvedValue(true);
    const roomEmit = jest.fn();
    server.to.mockReturnValue({ emit: roomEmit });
    const client = makeClient('user-1');

    await gateway.handleNewVote(client as never, {
      showId: 'show-1',
      contestantId: 'contestant-1',
    });

    expect(server.to).toHaveBeenCalledWith('show:show-1');
    expect(roomEmit).toHaveBeenCalledWith(
      'vote_update',
      expect.objectContaining({
        showId: 'show-1',
        contestantId: 'contestant-1',
        userId: 'user-1',
      })
    );
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('ignores votes from unauthenticated clients regardless of the flag', async () => {
    featureFlagService.isEnabled.mockResolvedValue(true);
    const client = makeClient(undefined);

    await gateway.handleNewVote(client as never, {
      showId: 'show-1',
      contestantId: 'contestant-1',
    });

    expect(featureFlagService.isEnabled).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalled();
    expect(server.to).not.toHaveBeenCalled();
  });
});
