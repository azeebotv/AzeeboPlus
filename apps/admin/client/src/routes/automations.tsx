import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  lastError?: string;
  type: 'content' | 'moderation' | 'analytics' | 'notification' | 'maintenance';
}

interface TaskRun {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'success' | 'failed';
  duration: number | null;
  output?: string;
}

/* ── Mock Data ─────────────────────────────────────────────────────────────── */

const MOCK_TASKS: ScheduledTask[] = [
  {
    id: '1',
    name: 'Content Moderation Scan',
    description: 'Scan uploaded content for policy violations',
    schedule: 'Every 15 minutes',
    lastRun: new Date(Date.now() - 600000).toISOString(),
    nextRun: new Date(Date.now() + 300000).toISOString(),
    status: 'active',
    type: 'moderation',
  },
  {
    id: '2',
    name: 'Analytics Aggregation',
    description: 'Aggregate daily analytics data',
    schedule: 'Daily at 2:00 AM',
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 43200000).toISOString(),
    status: 'active',
    type: 'analytics',
  },
  {
    id: '3',
    name: 'Stale Content Cleanup',
    description: 'Archive content older than 2 years with low engagement',
    schedule: 'Weekly on Sunday',
    lastRun: new Date(Date.now() - 604800000).toISOString(),
    nextRun: new Date(Date.now() + 259200000).toISOString(),
    status: 'active',
    type: 'content',
  },
  {
    id: '4',
    name: 'Push Notification Digest',
    description: 'Send weekly digest notifications to users',
    schedule: 'Weekly on Monday at 10:00 AM',
    lastRun: new Date(Date.now() - 518400000).toISOString(),
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    status: 'active',
    type: 'notification',
  },
  {
    id: '5',
    name: 'Database Backup',
    description: 'Full database backup to cloud storage',
    schedule: 'Daily at 3:00 AM',
    lastRun: new Date(Date.now() - 79200000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    status: 'active',
    type: 'maintenance',
  },
  {
    id: '6',
    name: 'Cache Purge',
    description: 'Clear expired cache entries',
    schedule: 'Every hour',
    lastRun: new Date(Date.now() - 1800000).toISOString(),
    nextRun: new Date(Date.now() + 1800000).toISOString(),
    status: 'error',
    lastError: 'Redis connection timeout',
    type: 'maintenance',
  },
];

const TYPE_COLORS: Record<string, string> = {
  content: 'var(--admin-blue)',
  moderation: 'var(--admin-red)',
  analytics: 'var(--admin-emerald)',
  notification: 'var(--admin-amber)',
  maintenance: 'var(--admin-purple)',
};

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);

  const { data: tasks = MOCK_TASKS, isLoading } = useQuery({
    queryKey: ['admin', 'automations'],
    queryFn: async () => {
      // In production, fetch from API
      return MOCK_TASKS;
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // In production, call API to toggle task status
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automations'] });
    },
  });

  const runTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // In production, call API to run task immediately
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automations'] });
    },
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            Automations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Manage scheduled tasks and automated workflows
          </p>
        </div>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--brand-orange)',
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Create Task
        </button>
      </div>

      {/* Tasks Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 16,
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: 20,
              borderRadius: 16,
              border: `1px solid ${task.status === 'error' ? 'var(--admin-red)' : 'var(--border-default)'}`,
              backgroundColor: 'rgba(26,10,10,0.5)',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedTask(task)}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: `${TYPE_COLORS[task.type]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={task.type} size={20} color={TYPE_COLORS[task.type]} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>
                    {task.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {task.schedule}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor:
                    task.status === 'active'
                      ? 'rgba(16,185,129,0.12)'
                      : task.status === 'error'
                        ? 'rgba(239,68,68,0.12)'
                        : 'rgba(245,158,11,0.12)',
                  color:
                    task.status === 'active'
                      ? 'var(--admin-emerald)'
                      : task.status === 'error'
                        ? 'var(--admin-red)'
                        : 'var(--admin-amber)',
                }}
              >
                {task.status}
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {task.description}
            </p>

            {/* Last Error */}
            {task.lastError && (
              <div
                style={{
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  marginBottom: 12,
                  fontSize: 12,
                  color: 'var(--admin-red)',
                }}
              >
                {task.lastError}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Last run: {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runTaskMutation.mutate(task.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Run Now
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskMutation.mutate(task.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: task.status === 'active' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                    color: task.status === 'active' ? 'var(--admin-amber)' : 'var(--admin-emerald)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {task.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: 600,
              maxHeight: '80vh',
              padding: 24,
              borderRadius: 16,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>{selectedTask.name}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  padding: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Schedule
                </div>
                <div style={{ fontSize: 14 }}>{selectedTask.schedule}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Status
                </div>
                <div style={{ fontSize: 14, textTransform: 'capitalize' }}>
                  {selectedTask.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Last Run
                </div>
                <div style={{ fontSize: 14 }}>
                  {selectedTask.lastRun ? new Date(selectedTask.lastRun).toLocaleString() : 'Never'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Next Run
                </div>
                <div style={{ fontSize: 14 }}>
                  {new Date(selectedTask.nextRun).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Description
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedTask.description}</div>
            </div>

            {selectedTask.lastError && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--admin-red)', marginBottom: 4 }}>Last Error</div>
                <div style={{ fontSize: 13, color: 'var(--admin-red)' }}>{selectedTask.lastError}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  runTaskMutation.mutate(selectedTask.id);
                  setSelectedTask(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--brand-orange)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Run Now
              </button>
              <button
                onClick={() => {
                  toggleTaskMutation.mutate(selectedTask.id);
                  setSelectedTask(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {selectedTask.status === 'active' ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
