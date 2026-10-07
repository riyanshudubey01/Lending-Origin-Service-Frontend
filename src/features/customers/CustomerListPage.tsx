import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { authService } from '../auth/authService';

const employmentOptions = ['All', 'SALARIED', 'SELF_EMPLOYED'];

export function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      setLoading(true);
      setError('');

      try {
        const nextCustomers = await customerService.getCustomers();

        if (isMounted) {
          setCustomers(nextCustomers);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load customers.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let nextCustomers = [...customers];

    if (query) {
      nextCustomers = nextCustomers.filter((customer) => {
        const searchFields = [customer.fullName, customer.email, customer.phone].join(' ').toLowerCase();
        return searchFields.includes(query);
      });
    }

    if (employmentFilter !== 'All') {
      nextCustomers = nextCustomers.filter((customer) => customer.employmentType === employmentFilter);
    }

    nextCustomers.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest-income':
          return b.monthlyIncome - a.monthlyIncome;
        case 'lowest-income':
          return a.monthlyIncome - b.monthlyIncome;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return nextCustomers;
  }, [customers, employmentFilter, searchTerm, sortBy]);

  if (loading) {
    return <div className="page-block"><p>Loading customers...</p></div>;
  }

  if (error) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Customer management</p>
          <h1>Customers</h1>
        </div>

        {currentUser?.role === 'SALES' ? (
          <Button onClick={() => navigate('/customers/new')}>+ Create Customer</Button>
        ) : null}
      </div>

      <div className="panel-card" style={{ marginBottom: '20px' }}>
        <div className="form-grid-two">
          <div className="field">
            <label className="field__label" htmlFor="customer-search">Search</label>
            <input id="customer-search" className="input" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name/email/phone" aria-label="Search customers" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="employment-filter">Employment Type</label>
            <select id="employment-filter" className="input" value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}>
              {employmentOptions.map((type) => (
                <option key={type} value={type}>{type === 'All' ? 'All' : type === 'SALARIED' ? 'Salaried' : 'Self Employed'}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="customer-sort">Sort</label>
            <select id="customer-sort" className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest-income">Highest Income</option>
              <option value="lowest-income">Lowest Income</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <h3>No customers found.</h3>
          <p>Create your first customer.</p>
        </div>
      ) : (
        <div className="panel-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Employment Type</th>
                  <th>Monthly Income</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.employmentType === 'SALARIED' ? 'Salaried' : 'Self Employed'}</td>
                    <td>{formatCurrency(customer.monthlyIncome)}</td>
                    <td>
                      <Link to={`/customers/${customer.id}`} className="text-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
