import { JOB_RETENTION_POLICY, KeepJobsPolicy, JobRetentionPolicy } from './index';

describe('JOB_RETENTION_POLICY', () => {
  it('prunes completed jobs after one day or once 1000 remain', () => {
    expect(JOB_RETENTION_POLICY.removeOnComplete).toEqual({ age: 86400, count: 1000 });
  });

  it('keeps failed jobs for one week or until 5000 remain', () => {
    expect(JOB_RETENTION_POLICY.removeOnFail).toEqual({ age: 604800, count: 5000 });
  });

  it('is a plain, JSON-serializable policy with numeric windows', () => {
    const clone = JSON.parse(JSON.stringify(JOB_RETENTION_POLICY)) as JobRetentionPolicy;
    expect(clone).toEqual(JOB_RETENTION_POLICY);
    expect(typeof (JOB_RETENTION_POLICY.removeOnComplete as KeepJobsPolicy).age).toBe('number');
    expect(typeof (JOB_RETENTION_POLICY.removeOnComplete as KeepJobsPolicy).count).toBe('number');
  });
});
