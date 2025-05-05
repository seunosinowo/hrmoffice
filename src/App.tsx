import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import PublicLayout from "./layout/PublicLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import RoleBasedRoute from "./components/RoleBasedRoute";

// Lazy load components
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const EmailConfirmation = lazy(() => import("./pages/auth/EmailConfirmation"));
const PageDescription = lazy(() => import("./pages/Employee/PageDescription/PageDescription"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const AboutPage = lazy(() => import("./pages/NavPages/AboutPage"));
const Pricing = lazy(() => import("./pages/NavPages/Pricing"));
const Resources = lazy(() => import("./pages/NavPages/Resources"));
const BookDemoPage = lazy(() => import('./pages/NavPages/BookDemoPage'));
const Callback = lazy(() => import('./pages/auth/Callback'));
const WelcomePage = lazy(() => import("./pages/auth/WelcomePage"));

// Employee Components
const User = lazy(() => import("./pages/Employee/User_and_role_management/User"));
const EmployeeDetails = lazy(() => import("./pages/Employee/User_and_role_management/EmployeeDetails"));
const EmployeeJobAssignment = lazy(() => import("./pages/Employee/User_and_role_management/EmployeeJobAssignment"));
const EmployeeAssessorAssign = lazy(() => import("./pages/Employee/User_and_role_management/EmployeeAssessorAssign"));
const CompetencyDescription = lazy(() => import("./pages/Employee/Competency_framework/CompetencyDescription"));
const CompetencyCategory = lazy(() => import("./pages/Employee/Competency_framework/CompetencyCategory"));
const CompetencyProficiency = lazy(() => import("./pages/Employee/Competency_framework/CompetencyProficiency"));
const Competency = lazy(() => import("./pages/Employee/Competency_framework/Competency"));
const CompetencyDomain = lazy(() => import("./pages/Employee/Competency_framework/CompetencyDomain"));
const Job = lazy(() => import("./pages/Employee/Job_profiling/Job"));
const JobCompetencyProfile = lazy(() => import("./pages/Employee/Job_profiling/JobCompetencyProfile"));
const EmployeeAssessment = lazy(() => import("./pages/Employee/Assessment_management/EmployeeAssessment"));
const IndividualGap = lazy(() => import("./pages/Employee/Analytics/IndividualGap"));
const OrganizationGap = lazy(() => import("./pages/Employee/Analytics/OrganizationGap"));

// Assessor Components
const AssessorAssessment = lazy(() => import("./pages/Assessor/Assessment_management/AssessorAssessment"));
const ConsensusAssessment = lazy(() => import("./pages/Assessor/Assessment_management/ConsensusAssessment"));

// HR Components
const HRPageDescription = lazy(() => import("./pages/HR/PageDescription/PageDescription"));
const RoleManagement = lazy(() => import("./pages/HR/Role_management/RoleManagement"));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route component
const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }
  
  return <Outlet />;
};

// Authenticated Layout component
const AuthenticatedLayout = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <PublicLayout />;
  }
  
  return <AppLayout />;
};

export default function App() {
  const { user } = useAuth();
  
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
          <Route path="/auth/callback" element={<Callback />} />
          <Route path="/auth/welcome" element={<WelcomePage />} />

          {/* Root path redirect based on auth status */}
          <Route path="/" element={user ? <Navigate to="/page-description" /> : <Navigate to="/home" />} />

          {/* Public pages with conditional layout */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/book-demo" element={<BookDemoPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Employee Routes */}
              <Route path="/page-description" element={<PageDescription />} />
              <Route path="/dashboard" element={<Home />} />
              <Route path="/user" element={<User />} />
              <Route path="/employee-details" element={<EmployeeDetails />} />
              <Route path="/employee-job-assignment" element={<EmployeeJobAssignment />} />
              <Route path="/employee-assessor-assign" element={<EmployeeAssessorAssign />} />
              <Route path="/competency-description" element={<CompetencyDescription />} />
              <Route path="/competency-category" element={<CompetencyCategory />} />
              <Route path="/proficiency-description" element={<CompetencyProficiency />} />
              <Route path="/competency" element={<Competency />} />
              <Route path="/competency-domain" element={<CompetencyDomain />} />
              <Route path="/job" element={<Job />} />
              <Route path="/job-competency-profile" element={<JobCompetencyProfile />} />
              <Route path="/employee-assessment" element={<EmployeeAssessment />} />
              <Route path="/individual-gap" element={<IndividualGap />} />
              <Route path="/organization-gap" element={<OrganizationGap />} />

              {/* Assessor Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['assessor', 'hr']} />}>
                <Route path="/assessor/dashboard" element={<Home />} />
                <Route path="/assessor/assessment" element={<AssessorAssessment />} />
                <Route path="/assessor/consensus-assessment" element={<ConsensusAssessment />} />
              </Route>

              {/* HR Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['hr']} />}>
                <Route path="/hr/page-description" element={<HRPageDescription />} />
                <Route path="/hr/role-management" element={<RoleManagement />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}