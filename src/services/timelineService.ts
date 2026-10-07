import type { ApplicationTimelineEvent, LoanApplicationStatus } from '../types';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'los_application_timeline';

const STATUS_LABELS: Record<LoanApplicationStatus, string> = {
  DRAFT: 'Application created',
  SUBMITTED: 'Application submitted',
  ELIGIBILITY_FAILED: 'Eligibility failed',
  ELIGIBILITY_PASSED: 'Eligibility passed',
  CREDIT_CHECK: 'Credit check completed',
  CREDIT_FAILED: 'Credit check failed',
  CREDIT_PASSED: 'Credit check passed',
  UNDERWRITING: 'Underwriting started',
  APPROVED: 'Application approved',
  REJECTED: 'Application rejected',
  SANCTIONED: 'Sanction generated',
  READY_FOR_DISBURSEMENT: 'Loan ready for disbursement',
  DISBURSED: 'Loan disbursed',
};

const readEvents = (): ApplicationTimelineEvent[] => storage.get<ApplicationTimelineEvent[]>(STORAGE_KEY) ?? [];

export const timelineService = {
  getTimeline(applicationId: number): ApplicationTimelineEvent[] {
    return readEvents().filter((event) => event.applicationId === applicationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  addTimelineEvent(event: Omit<ApplicationTimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }): ApplicationTimelineEvent {
    const createdEvent: ApplicationTimelineEvent = {
      id: Date.now() + Math.round(Math.random() * 1000),
      applicationId: event.applicationId,
      status: event.status,
      label: event.label || STATUS_LABELS[event.status],
      timestamp: event.timestamp ?? new Date().toISOString(),
      performedBy: event.performedBy,
    };

    const events = readEvents();
    events.push(createdEvent);
    storage.set(STORAGE_KEY, events);

    return createdEvent;
  },

  recordStatusTransition(applicationId: number, status: LoanApplicationStatus, performedBy?: string): ApplicationTimelineEvent | null {
    const label = STATUS_LABELS[status] ?? status;
    return this.addTimelineEvent({ applicationId, status, label, performedBy });
  },
};
