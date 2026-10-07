import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { applicationService } from '../../services/applicationService';
import { customerService } from '../../services/customerService';
import type { Customer, LoanType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const loanTypeOptions: LoanType[] = ['PERSONAL', 'HOME', 'AUTO'];

const initialForm = {
  loanType: 'PERSONAL' as LoanType,
  requestedAmount: '',
  tenureMonths: '36',
  purpose: '',
};

export function ApplicationCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdParam = searchParams.get('customerId');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerId = useMemo(() => Number(customerIdParam), [customerIdParam]);

  useEffect(() => {
    if (!customerIdParam || !Number.isFinite(customerId) || customerId <= 0) {
      setError('Customer not found.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadCustomer = async () => {
      setLoading(true);
      setError('');

      try {
        const nextCustomer = await customerService.getCustomerById(customerId);

        if (!isMounted) {
          return;
        }

        if (!nextCustomer) {
          setError('Customer not found.');
          return;
        }

        setCustomer(nextCustomer);
      } catch {
        if (isMounted) {
          setError('Unable to load customer details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [customerId, customerIdParam]);

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (!form.loanType) {
      nextErrors.loanType = 'Loan type is required.';
    }

    const requestedAmount = Number(form.requestedAmount);
    if (!form.requestedAmount || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      nextErrors.requestedAmount = 'Requested amount must be greater than 0.';
    }

    const tenure = Number(form.tenureMonths);
    if (!form.tenureMonths || Number.isNaN(tenure) || tenure <= 0) {
      nextErrors.tenureMonths = 'Tenure must be greater than 0.';
    }

    if (form.purpose.trim().length < 5) {
      nextErrors.purpose = 'Purpose must be at least 5 characters long.';
    }

    return nextErrors;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const submitApplication = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!customer) {
      return;
    }

    const nextErrors = validate();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdApplication = await applicationService.createApplication({
        customerId: customer.id,
        loanType: form.loanType,
        requestedAmount: Number(form.requestedAmount),
        tenureMonths: Number(form.tenureMonths),
        purpose: form.purpose.trim(),
        status,
      });

      navigate(`/applications/${createdApplication.id}`);
    } catch {
      setError('Unable to create loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-block"><p>Loading customer details...</p></div>;
  }

  if (error || !customer) {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>{error || 'Customer not found.'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">New loan application</p>
          <h1>Create Loan Application</h1>
        </div>
      </div>

      <div className="panel-card">
        <div className="info-grid">
          <div>
            <span className="label">Customer Name</span>
            <strong>{customer.fullName}</strong>
          </div>
          <div>
            <span className="label">Customer ID</span>
            <strong>{customer.id}</strong>
          </div>
          <div>
            <span className="label">Monthly Income</span>
            <strong>{formatCurrency(customer.monthlyIncome)}</strong>
          </div>
        </div>
      </div>

      <form className="form-card" onSubmit={(event) => {
        event.preventDefault();
        void submitApplication('DRAFT');
      }} noValidate>
        <div className="form-grid-two">
          <div className="field field--full">
            <label htmlFor="loanType" className="field__label">Loan Type</label>
            <select
              id="loanType"
              name="loanType"
              className="input"
              value={form.loanType}
              onChange={handleInputChange}
            >
              {loanTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {fieldErrors.loanType ? <span className="field__error">{fieldErrors.loanType}</span> : null}
          </div>

          <Input
            label="Requested Amount"
            name="requestedAmount"
            type="number"
            min="1"
            value={form.requestedAmount}
            onChange={handleInputChange}
            error={fieldErrors.requestedAmount}
          />

          <Input
            label="Tenure"
            name="tenureMonths"
            type="number"
            min="1"
            value={form.tenureMonths}
            onChange={handleInputChange}
            error={fieldErrors.tenureMonths}
          />

          <div className="field field--full">
            <label htmlFor="purpose" className="field__label">Purpose</label>
            <textarea
              id="purpose"
              name="purpose"
              className="input textarea"
              value={form.purpose}
              onChange={handleInputChange}
              rows={4}
            />
            {fieldErrors.purpose ? <span className="field__error">{fieldErrors.purpose}</span> : null}
          </div>
        </div>

        {error ? <div className="inline-error">{error}</div> : null}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            type="button"
            onClick={() => void submitApplication('SUBMITTED')}
            disabled={isSubmitting}
          >
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
