import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { customerService } from '../../services/customerService';
import type { CustomerFormValues } from '../../types';
import { authService } from '../auth/authService';

const initialForm: CustomerFormValues = {
  fullName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  employmentType: 'SALARIED',
  monthlyIncome: '',
};

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomerFormValues>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authService.getCurrentUser()?.role !== 'SALES') {
    return (
      <div className="page-block">
        <div className="error-panel">
          <h3>You are not authorized to create customers.</h3>
        </div>
      </div>
    );
  }

  const validate = (): Partial<Record<keyof CustomerFormValues, string>> => {
    const nextErrors: Partial<Record<keyof CustomerFormValues, string>> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of birth is required.';
    } else {
      const selectedDate = new Date(form.dateOfBirth);
      const today = new Date();
      if (selectedDate > today) {
        nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Email is invalid.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone is required.';
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      nextErrors.phone = 'Phone must be a valid 10-digit Indian mobile number.';
    }

    const incomeValue = Number(form.monthlyIncome);
    if (!form.monthlyIncome || Number.isNaN(incomeValue) || incomeValue <= 0) {
      nextErrors.monthlyIncome = 'Monthly income must be greater than 0.';
    }

    return nextErrors;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const createdCustomer = await customerService.createCustomer(form);
      navigate(`/customers/${createdCustomer.id}`, {
        state: { successMessage: 'Customer created successfully.' },
      });
    } catch {
      setError('Unable to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-block">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Customer onboarding</p>
          <h1>Create Customer</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-grid-two">
          <Input
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />

          <Input
            label="Date of Birth"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
            type="date"
          />

          <Input
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            type="email"
          />

          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            inputMode="numeric"
          />

          <div className="field">
            <label htmlFor="employmentType" className="field__label">
              Employment Type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              className="input"
              value={form.employmentType}
              onChange={handleChange}
            >
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self Employed</option>
            </select>
          </div>

          <Input
            label="Monthly Income"
            name="monthlyIncome"
            value={form.monthlyIncome}
            onChange={handleChange}
            error={errors.monthlyIncome}
            type="number"
            min="1"
          />
        </div>

        {error ? <div className="inline-error">{error}</div> : null}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/customers')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
