/**
 * Incident Command Service (TAA §64)
 *
 * Manages incident response:
 * - SEV-1/SEV-2 escalation procedures
 * - Incident commander assignment
 * - Postmortem tracking
 * - On-call rotation
 * - Status page integration
 */

export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type IncidentStatus = 'open' | 'mitigated' | 'resolved' | 'postmortem';

export interface Incident {
  /** Incident ID */
  id: string;
  /** Incident title */
  title: string;
  /** Incident description */
  description: string;
  /** Severity */
  severity: IncidentSeverity;
  /** Status */
  status: IncidentStatus;
  /** Commander ID */
  commanderId: string;
  /** Commander name */
  commanderName: string;
  /** Affected services */
  affectedServices: string[];
  /** Impact description */
  impact: string;
  /** Timeline entries */
  timeline: TimelineEntry[];
  /** Bridge/meeting URL */
  bridgeUrl?: string;
  /** Status page ID */
  statusPageId?: string;
  /** Created at */
  createdAt: Date;
  /** Mitigated at */
  mitigatedAt?: Date;
  /** Resolved at */
  resolvedAt?: Date;
  /** Postmortem due date */
  postmortemDueDate?: Date;
  /** Postmortem completed */
  postmortemCompleted?: boolean;
  /** Metrics */
  metrics: IncidentMetrics;
}

export interface TimelineEntry {
  /** Timestamp */
  timestamp: Date;
  /** Entry type */
  type: 'created' | 'updated' | 'escalated' | 'commander_changed' | 'resolved' | 'postmortem';
  /** Entry message */
  message: string;
  /** Author */
  author: string;
}

export interface IncidentMetrics {
  /** Time to detect (minutes) */
  timeToDetect: number;
  /** Time to mitigate (minutes) */
  timeToMitigate: number;
  /** Time to resolve (minutes) */
  timeToResolve: number;
  /** Time to postmortem (days) */
  timeToPostmortem: number;
}

export interface OnCallSchedule {
  /** Schedule ID */
  id: string;
  /** Schedule name */
  name: string;
  /** Current on-call person */
  currentOnCall: OnCallPerson;
  /** Next on-call person */
  nextOnCall: OnCallPerson;
  /** Rotation interval (hours) */
  rotationHours: number;
}

export interface OnCallPerson {
  /** Person ID */
  id: string;
  /** Person name */
  name: string;
  /** Email */
  email: string;
  /** Phone */
  phone: string;
  /** Slack handle */
  slackHandle: string;
}

export interface Postmortem {
  /** Incident ID */
  incidentId: string;
  /** Summary */
  summary: string;
  /** Root cause */
  rootCause: string;
  /** Impact */
  impact: string;
  /** Timeline */
  timeline: string;
  /** Action items */
  actionItems: ActionItem[];
  /** Lessons learned */
  lessonsLearned: string[];
  /** Created at */
  createdAt: Date;
}

export interface ActionItem {
  /** Item ID */
  id: string;
  /** Description */
  description: string;
  /** Owner */
  owner: string;
  /** Due date */
  dueDate: Date;
  /** Status */
  status: 'pending' | 'in_progress' | 'completed';
}

export const SEVERITY_RESPONSE: Record<
  IncidentSeverity,
  {
    response: string;
    commanderRequired: boolean;
    bridgeRequired: boolean;
    executiveNotification: boolean;
    postmortemRequired: boolean;
  }
> = {
  'SEV-1': {
    response:
      'Immediate commander, bridge, rollback/containment, executive notification, mandatory postmortem',
    commanderRequired: true,
    bridgeRequired: true,
    executiveNotification: true,
    postmortemRequired: true,
  },
  'SEV-2': {
    response: 'Named owner, rapid mitigation, postmortem',
    commanderRequired: true,
    bridgeRequired: false,
    executiveNotification: false,
    postmortemRequired: true,
  },
  'SEV-3': {
    response: 'Normal engineering priority',
    commanderRequired: false,
    bridgeRequired: false,
    executiveNotification: false,
    postmortemRequired: false,
  },
  'SEV-4': {
    response: 'Backlog/maintenance',
    commanderRequired: false,
    bridgeRequired: false,
    executiveNotification: false,
    postmortemRequired: false,
  },
};

export class IncidentService {
  private readonly incidents: Map<string, Incident> = new Map();
  private readonly postmortems: Map<string, Postmortem> = new Map();
  private readonly onCallSchedules: Map<string, OnCallSchedule> = new Map();

  /**
   * Create a new incident
   */
  createIncident(data: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    commanderId: string;
    commanderName: string;
    affectedServices: string[];
    impact: string;
    bridgeUrl?: string;
  }): Incident {
    const incident: Incident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'open',
      commanderId: data.commanderId,
      commanderName: data.commanderName,
      affectedServices: data.affectedServices,
      impact: data.impact,
      timeline: [
        {
          timestamp: new Date(),
          type: 'created',
          message: `Incident created: ${data.title}`,
          author: data.commanderName,
        },
      ],
      bridgeUrl: data.bridgeUrl,
      createdAt: new Date(),
      metrics: {
        timeToDetect: 0,
        timeToMitigate: 0,
        timeToResolve: 0,
        timeToPostmortem: 0,
      },
    };

    this.incidents.set(incident.id, incident);
    return incident;
  }

  /**
   * Update incident status
   */
  updateIncident(
    incidentId: string,
    status: IncidentStatus,
    message: string,
    author: string
  ): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = status;
    incident.timeline.push({
      timestamp: new Date(),
      type: status === 'resolved' ? 'resolved' : 'updated',
      message,
      author,
    });

    if (status === 'mitigated') {
      incident.mitigatedAt = new Date();
      incident.metrics.timeToMitigate =
        (incident.mitigatedAt.getTime() - incident.createdAt.getTime()) / 60000;
    } else if (status === 'resolved') {
      incident.resolvedAt = new Date();
      incident.metrics.timeToResolve =
        (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000;
    }

    return incident;
  }

  /**
   * Get an incident
   */
  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values()).filter(
      (i) => i.status === 'open' || i.status === 'mitigated'
    );
  }

  /**
   * Get incidents by severity
   */
  getIncidentsBySeverity(severity: IncidentSeverity): Incident[] {
    return Array.from(this.incidents.values()).filter((i) => i.severity === severity);
  }

  /**
   * Get incident metrics
   */
  getMetrics(): {
    totalIncidents: number;
    activeIncidents: number;
    bySeverity: Record<IncidentSeverity, number>;
    averageTimeToMitigate: number;
    averageTimeToResolve: number;
  } {
    const incidents = Array.from(this.incidents.values());
    const resolved = incidents.filter((i) => i.resolvedAt);

    return {
      totalIncidents: incidents.length,
      activeIncidents: incidents.filter((i) => i.status === 'open' || i.status === 'mitigated')
        .length,
      bySeverity: {
        'SEV-1': incidents.filter((i) => i.severity === 'SEV-1').length,
        'SEV-2': incidents.filter((i) => i.severity === 'SEV-2').length,
        'SEV-3': incidents.filter((i) => i.severity === 'SEV-3').length,
        'SEV-4': incidents.filter((i) => i.severity === 'SEV-4').length,
      },
      averageTimeToMitigate:
        resolved.length > 0
          ? resolved.reduce((sum, i) => sum + i.metrics.timeToMitigate, 0) / resolved.length
          : 0,
      averageTimeToResolve:
        resolved.length > 0
          ? resolved.reduce((sum, i) => sum + i.metrics.timeToResolve, 0) / resolved.length
          : 0,
    };
  }

  /**
   * Create a postmortem
   */
  createPostmortem(
    incidentId: string,
    data: Omit<Postmortem, 'incidentId' | 'createdAt'>
  ): Postmortem | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const postmortem: Postmortem = {
      ...data,
      incidentId,
      createdAt: new Date(),
    };

    this.postmortems.set(incidentId, postmortem);
    incident.postmortemCompleted = true;

    return postmortem;
  }

  /**
   * Get postmortem for an incident
   */
  getPostmortem(incidentId: string): Postmortem | undefined {
    return this.postmortems.get(incidentId);
  }

  /**
   * Get pending postmortems
   */
  getPendingPostmortems(): Incident[] {
    return Array.from(this.incidents.values()).filter(
      (i) => i.status === 'resolved' && !i.postmortemCompleted && i.severity in ['SEV-1', 'SEV-2']
    );
  }

  /**
   * Set on-call schedule
   */
  setOnCallSchedule(schedule: OnCallSchedule): void {
    this.onCallSchedules.set(schedule.id, schedule);
  }

  /**
   * Get current on-call person
   */
  getCurrentOnCall(scheduleId: string): OnCallPerson | undefined {
    return this.onCallSchedules.get(scheduleId)?.currentOnCall;
  }

  /**
   * Get incident statistics
   */
  getStats(): {
    totalIncidents: number;
    resolvedIncidents: number;
    pendingPostmortems: number;
    averageTimeToMitigate: number;
    averageTimeToResolve: number;
  } {
    const incidents = Array.from(this.incidents.values());
    const resolved = incidents.filter((i) => i.resolvedAt);
    const pendingPostmortems = this.getPendingPostmortems();

    return {
      totalIncidents: incidents.length,
      resolvedIncidents: resolved.length,
      pendingPostmortems: pendingPostmortems.length,
      averageTimeToMitigate: this.getMetrics().averageTimeToMitigate,
      averageTimeToResolve: this.getMetrics().averageTimeToResolve,
    };
  }
}
