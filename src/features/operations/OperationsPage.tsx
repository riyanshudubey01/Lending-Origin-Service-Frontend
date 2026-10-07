import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import type { Customer, LoanApplication } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const statusGroups = [
  { key: 'SUBMITTED', label: 'Eligibility Pending' },
  { key: 'ELIGIBILITY_PASSED', label: 'Credit Pending' },
  { key: 'CREDIT_PASSED', label: 'Underwriting Pending' },
  { key: 'APPROVED', label: 'Sanction Pending' },
  { key: 'READY_FOR_DISBURSEMENT', label: 'Disbursement Pending' },
] as const;

export function OperationsPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [apps, allCustomers] = await Promise.all([
          applicationService.getApplications(),
          customerService.getCustomers(),
        ]);

        if (!isMounted) {
          return;
        }

        setCustomers(Object.fromEntries(allCustomers.map((customer) => [customer.id, customer])) as Record<number, Customer>);
        setApplications(apps);
      } catch {
        if (isMounted) {
          setError('Unable to load operations queue.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedApplications = useMemo(() => statusGroups.map((group) => ({
    ...group,
    items: applications.filter((application) => application.status === group.key),
  })), [applications]);

  if (loading) {
    return <div className="page-block"><p>Loading operations queue...</p></div>;
  }

  if (error) {
    return <div className="page-block"><div className="error-panel"><h3>{error}</h3></div></div>;
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Operations queue</h1>
        </div>
      </div>

      <div className="panel-card">
        {groupedApplications.map((group) => (
          <div key={group.key} style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>{group.label}</h3>

            {group.items.length === 0 ? (
              <div className="empty-state">No applications in this queue.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((application) => (
                      <tr key={application.id}>
                        <td>{application.id}</td>
                        <td>{customers[application.customerId]?.fullName ?? 'Unknown customer'}</td>
                        <td>{formatCurrency(application.requestedAmount)}</td>
                        <td><StatusBadge status={application.status} /></td>
                        <td>
                          <Link to={`/applications/${application.id}`} className="text-link">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
