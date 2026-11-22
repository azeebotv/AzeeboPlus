import {
  PartitionedStreamManager,
  HighVelocityVoteBuffer,
} from './partitioned-stream';

describe('PartitionedStreamManager', () => {
  it('deterministically hashes keys into expected partition bounds', () => {
    const numPartitions = 8;
    for (let i = 0; i < 50; i++) {
      const p = PartitionedStreamManager.getPartition(`contestant-${i}`, numPartitions);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(numPartitions);
    }
  });

  it('guarantees identical partition for identical key (deterministic)', () => {
    const key = 'show-100:contestant-42';
    const p1 = PartitionedStreamManager.getPartition(key, 16);
    const p2 = PartitionedStreamManager.getPartition(key, 16);
    expect(p1).toBe(p2);
  });

  it('generates Redis Cluster safe hashtagged channels', () => {
    const channel = PartitionedStreamManager.getPartitionChannel(
      'azeebo:events',
      'reality.vote',
      3
    );
    expect(channel).toBe('azeebo:events:reality.vote:{p_3}');
  });

  it('publishes event to calculated partition channel', async () => {
    const mockRedis = {
      publish: jest.fn().mockResolvedValue(1),
    };

    const event = {
      id: 'evt-1',
      type: 'reality.vote',
      source: 'reality-service',
      timestamp: new Date().toISOString(),
      data: { contestantId: 'c1', quantity: 5 },
    };

    const result = await PartitionedStreamManager.publishPartitioned(
      mockRedis as any,
      'azeebo:events',
      'reality.vote',
      'show-1:c1',
      event,
      4
    );

    expect(result.channel).toBe(`azeebo:events:reality.vote:{p_${result.partition}}`);
    expect(mockRedis.publish).toHaveBeenCalledWith(
      result.channel,
      expect.stringContaining('"partition":' + result.partition)
    );
  });
});

describe('HighVelocityVoteBuffer', () => {
  it('aggregates multiple votes in memory before flush', async () => {
    const buffer = new HighVelocityVoteBuffer({ maxBufferSize: 1000 });

    buffer.recordVote('show-1', 'c1', 1, 'user-1');
    buffer.recordVote('show-1', 'c1', 3, 'user-2');
    buffer.recordVote('show-1', 'c2', 2, 'user-3');

    expect(buffer.getPendingTally('show-1', 'c1')).toBe(4);
    expect(buffer.getPendingTally('show-1', 'c2')).toBe(2);
    expect(buffer.pendingCount).toBe(6);

    const flushed = await buffer.flush();
    expect(flushed.flushedCount).toBe(6);
    expect(flushed.aggregations).toHaveLength(2);

    const c1Agg = flushed.aggregations.find((a) => a.contestantId === 'c1');
    expect(c1Agg?.totalVotes).toBe(4);
    expect(c1Agg?.voterCount).toBe(2);

    // Buffer reset
    expect(buffer.pendingCount).toBe(0);
    expect(buffer.getPendingTally('show-1', 'c1')).toBe(0);

    await buffer.dispose();
  });

  it('triggers onFlush callback when maxBufferSize threshold is reached', async () => {
    const flushHandler = jest.fn().mockResolvedValue(undefined);
    const buffer = new HighVelocityVoteBuffer({
      maxBufferSize: 5,
      onFlush: flushHandler,
    });

    buffer.recordVote('show-1', 'c1', 3, 'user-1');
    expect(flushHandler).not.toHaveBeenCalled();

    // Reaching 5 triggers flush
    buffer.recordVote('show-1', 'c1', 2, 'user-2');

    expect(flushHandler).toHaveBeenCalledTimes(1);
    expect(flushHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        flushedCount: 5,
      })
    );

    await buffer.dispose();
  });
});
