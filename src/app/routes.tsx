import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { ApplicationCreatePage } from '../features/applications/ApplicationCreatePage';
import { ApplicationDetailsPage } from '../features/applications/ApplicationDetailsPage';
import { ApplicationListPage } from '../features/applications/ApplicationListPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CustomerCreatePage } from '../features/customers/CustomerCreatePage';
import { CustomerDetailsPage } from '../features/customers/CustomerDetailsPage';
import { CustomerListPage } from '../features/customers/CustomerListPage';
import { DisbursementPage } from '../features/disbursement/DisbursementPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { OperationsPage } from '../features/operations/OperationsPage';
import { SanctionPage } from '../features/sanction/SanctionPage';
import { UnderwritingPage } from '../features/underwriting/UnderwritingPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<CustomerCreatePage />} />
          <Route path="/customers/:id" element={<CustomerDetailsPage />} />
          <Route path="/applications" element={<ApplicationListPage />} />
          <Route path="/applications/new" element={<ApplicationCreatePage />} />
          <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="/underwriting/:applicationId" element={<UnderwritingPage />} />
          <Route path="/sanction/:applicationId" element={<SanctionPage />} />
          <Route path="/disbursement/:applicationId" element={<DisbursementPage />} />
          <Route path="/operations" element={<OperationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
