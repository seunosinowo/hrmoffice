import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import PublicLayout from "./layout/PublicLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { RoleBasedRoute } from "./components/RoleBasedRoute";

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
const EmployeeConsensusAssessment = lazy(() => import("./pages/Employee/Assessment_management/ConsensusAssessment"));
const EmployeeAnalytics = lazy(() => import("./pages/Employee/Analytics/IndividualGap"));

// Assessor Components
const AssessorAssessment = lazy(() => import("./pages/Assessor/Assessment_management/AssessorAssessment"));
const AssessorConsensusAssessment = lazy(() => import("./pages/Assessor/Assessment_management/ConsensusAssessment"));
const AssessorAnalytics = lazy(() => import("./pages/Assessor/Analytics/IndividualGap"));
const AssessorIndividualGap = lazy(() => import("./pages/Assessor/Analytics/IndividualGap"));
const AssessorOrganizationGap = lazy(() => import("./pages/Assessor/Analytics/OrganizationGap"));
const AssessorEmployeeAssessment = lazy(() => import("./pages/Assessor/Assessment_management/EmployeeAssessment"));
const AssessorCompetency = lazy(() => import("./pages/Assessor/Competency_framework/Competency"));
const AssessorCompetencyCategory = lazy(() => import("./pages/Assessor/Competency_framework/CompetencyCategory"));
const AssessorCompetencyDescription = lazy(() => import("./pages/Assessor/Competency_framework/CompetencyDescription"));
const AssessorCompetencyDomain = lazy(() => import("./pages/Assessor/Competency_framework/CompetencyDomain"));
const AssessorCompetencyProficiency = lazy(() => import("./pages/Assessor/Competency_framework/CompetencyProficiency"));
const AssessorJob = lazy(() => import("./pages/Assessor/Job_profiling/Job"));
const AssessorJobCompetencyProfile = lazy(() => import("./pages/Assessor/Job_profiling/JobCompetencyProfile"));
const AssessorPageDescription = lazy(() => import("./pages/Assessor/PageDescription/PageDescription"));
const AssessorEmployeeAssessorAssign = lazy(() => import("./pages/Assessor/User_and_role_management/EmployeeAssessorAssign"));
const AssessorEmployeeDetails = lazy(() => import("./pages/Assessor/User_and_role_management/EmployeeDetails"));
const AssessorEmployeeJobAssignment = lazy(() => import("./pages/Assessor/User_and_role_management/EmployeeJobAssignment"));
const AssessorUser = lazy(() => import("./pages/Assessor/User_and_role_management/User"));

// HR Components
const HRPageDescription = lazy(() => import("./pages/HR/PageDescription/PageDescription"));
const RoleManagement = lazy(() => import("./pages/HR/Role_management/RoleManagement"));
const HRAnalytics = lazy(() => import("./pages/HR/Analytics/IndividualGap"));
const HRIndividualGap = lazy(() => import("./pages/HR/Analytics/IndividualGap"));
const HROrganizationGap = lazy(() => import("./pages/HR/Analytics/OrganizationGap"));
const HRAssessorAssessment = lazy(() => import("./pages/HR/Assessment_management/AssessorAssessment"));
const HRConsensusAssessment = lazy(() => import("./pages/HR/Assessment_management/ConsensusAssessment"));
const HREmployeeAssessment = lazy(() => import("./pages/HR/Assessment_management/EmployeeAssessment"));
const HRCompetency = lazy(() => import("./pages/HR/Competency_framework/Competency"));
const HRCompetencyCategory = lazy(() => import("./pages/HR/Competency_framework/CompetencyCategory"));
const HRCompetencyDescription = lazy(() => import("./pages/HR/Competency_framework/CompetencyDescription"));
const HRCompetencyDomain = lazy(() => import("./pages/HR/Competency_framework/CompetencyDomain"));
const HRCompetencyProficiency = lazy(() => import("./pages/HR/Competency_framework/CompetencyProficiency"));
const HRJob = lazy(() => import("./pages/HR/Job_profiling/Job"));
const HRJobCompetencyProfile = lazy(() => import("./pages/HR/Job_profiling/JobCompetencyProfile"));
const HREmployeeAssessorAssign = lazy(() => import("./pages/HR/User_and_role_management/EmployeeAssessorAssign"));
const HREmployeeDetails = lazy(() => import("./pages/HR/User_and_role_management/EmployeeDetails"));
const HREmployeeJobAssignment = lazy(() => import("./pages/HR/User_and_role_management/EmployeeJobAssignment"));
const HRUser = lazy(() => import("./pages/HR/User_and_role_management/User"));

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
              <Route path="assessment" element={<AssessorAssessment />} />
              <Route path="/assessor-assessment" element={<AssessorAssessment />} />
              <Route path="/organization-gap" element={<OrganizationGap />} />
              <Route path="/employee/consensus-assessment" element={<EmployeeConsensusAssessment />} />
              <Route path="/employee/analytics" element={<EmployeeAnalytics />} />

              {/* Assessor Routes */}
              {/* RoleBasedRoute is used to restrict access to routes based on user roles (e.g., 'employee', 'hr', 'assessor'). */}
              <Route element={<RoleBasedRoute allowedRoles={['assessor']} />}>
                <Route path="/assessor/page-description" element={<AssessorPageDescription />} />
                <Route path="/assessor/user" element={<AssessorUser />} />
                <Route path="/assessor/employee-details" element={<AssessorEmployeeDetails />} />
                <Route path="/assessor/employee-job-assignment" element={<AssessorEmployeeJobAssignment />} />
                <Route path="/assessor/employee-assessor-assign" element={<AssessorEmployeeAssessorAssign />} />
                <Route path="/assessor/competency-description" element={<AssessorCompetencyDescription />} />
                <Route path="/assessor/competency-category" element={<AssessorCompetencyCategory />} />
                <Route path="/assessor/proficiency-description" element={<AssessorCompetencyProficiency />} />
                <Route path="/assessor/competency" element={<AssessorCompetency />} />
                <Route path="/assessor/competency-domain" element={<AssessorCompetencyDomain />} />
                <Route path="/assessor/job" element={<AssessorJob />} />
                <Route path="/assessor/job-competency-profile" element={<AssessorJobCompetencyProfile />} />
                <Route path="/assessor/employee-assessment" element={<AssessorEmployeeAssessment />} />
                <Route path="/assessor/individual-gap" element={<AssessorIndividualGap />} />
                <Route path="/assessor/organization-gap" element={<AssessorOrganizationGap />} />
                <Route path="/assessor/analytics" element={<AssessorAnalytics />} />
                <Route path="/assessor/consensus-assessment" element={<AssessorConsensusAssessment />} />
              </Route>

              {/* HR Routes */}
              <Route element={<RoleBasedRoute allowedRoles={['hr']} />}>
                <Route path="/hr/page-description" element={<HRPageDescription />} />
                <Route path="/hr/role-management" element={<RoleManagement />} />
                <Route path="/hr/analytics/individual-gap" element={<HRIndividualGap />} />
                <Route path="/hr/analytics/organization-gap" element={<HROrganizationGap />} />
                <Route path="/hr/assessment/assessor-assessment" element={<HRAssessorAssessment />} />
                <Route path="/hr/assessment/consensus-assessment" element={<HRConsensusAssessment />} />
                <Route path="/hr/assessment/employee-assessment" element={<HREmployeeAssessment />} />
                <Route path="/hr/competency/competency" element={<HRCompetency />} />
                <Route path="/hr/competency/competency-category" element={<HRCompetencyCategory />} />
                <Route path="/hr/competency/competency-description" element={<HRCompetencyDescription />} />
                <Route path="/hr/competency/competency-domain" element={<HRCompetencyDomain />} />
                <Route path="/hr/competency/competency-proficiency" element={<HRCompetencyProficiency />} />
                <Route path="/hr/job/job" element={<HRJob />} />
                <Route path="/hr/job/job-competency-profile" element={<HRJobCompetencyProfile />} />
                <Route path="/hr/user/employee-assessor-assign" element={<HREmployeeAssessorAssign />} />
                <Route path="/hr/user/employee-details" element={<HREmployeeDetails />} />
                <Route path="/hr/user/employee-job-assignment" element={<HREmployeeJobAssignment />} />
                <Route path="/hr/user/user" element={<HRUser />} />
                <Route path="/hr/consensus-assessment" element={<HRConsensusAssessment />} />
                <Route path="/hr/analytics" element={<HRAnalytics />} />
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