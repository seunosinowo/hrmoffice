import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import PublicLayout from "./layout/PublicLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Lazy load components
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const EmailConfirmation = lazy(() => import("./pages/auth/EmailConfirmation"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const PageDescription = lazy(() => import("./pages/PageDescription/PageDescription"));
const User = lazy(() => import("./pages/User_and_role_management/User"));
const EmployeeDetails = lazy(() => import("./pages/User_and_role_management/EmployeeDetails"));
const EmployeeJobAssignment = lazy(() => import("./pages/User_and_role_management/EmployeeJobAssignment"));
const EmployeeAssessorAssign = lazy(() => import("./pages/User_and_role_management/EmployeeAssessorAssign"));
const CompetencyDescription = lazy(() => import("./pages/Competency_framework/CompetencyDescription"));
const CompetencyCategory = lazy(() => import("./pages/Competency_framework/CompetencyCategory"));
const CompetencyProficiency = lazy(() => import("./pages/Competency_framework/CompetencyProficiency"));
const Competency = lazy(() => import("./pages/Competency_framework/Competency"));
const CompetencyDomain = lazy(() => import("./pages/Competency_framework/CompetencyDomain"));
const Job = lazy(() => import("./pages/Job_profiling/Job"));
const JobCompetencyProfile = lazy(() => import("./pages/Job_profiling/JobCompetencyProfile"));
const EmployeeAssessment = lazy(() => import("./pages/Assessment_management/EmployeeAssessment"));
const AssessorAssessment = lazy(() => import("./pages/Assessment_management/AssessorAssessment"));
const ConsensusAssessment = lazy(() => import("./pages/Assessment_management/ConsensusAssessment"));
const IndividualGap = lazy(() => import("./pages/Analytics/IndividualGap"));
const OrganizationGap = lazy(() => import("./pages/Analytics/OrganizationGap"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const AboutPage = lazy(() => import("./pages/NavPages/AboutPage"));
const Pricing = lazy(() => import("./pages/NavPages/Pricing"));
const Resources = lazy(() => import("./pages/NavPages/Resources"));
const BookDemoPage = lazy(() => import('./pages/NavPages/BookDemoPage'));
const Callback = lazy(() => import('./pages/auth/Callback'));
const WelcomePage = lazy(() => import("./pages/auth/WelcomePage"));

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

          {/* Protected Routes with AppLayout (includes sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Page Description as the main landing page for authenticated users */}
              <Route path="/page-description" element={<PageDescription />} />
              
              {/* Dashboard */}
              <Route path="/dashboard" element={<Home />} />
              
              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

              {/* User and Role Management */}
              <Route path="/user" element={<User />} />
              <Route path="/employee-details" element={<EmployeeDetails />} />
              <Route path="/employee-job-assignment" element={<EmployeeJobAssignment />} />
              <Route path="/employee-assessor-assign" element={<EmployeeAssessorAssign />} />

              {/* Competency Framework */}
              <Route path="/competency-description" element={<CompetencyDescription />} />
              <Route path="/competency-category" element={<CompetencyCategory />} />
              <Route path="/proficiency-description" element={<CompetencyProficiency />} />
              <Route path="/competency" element={<Competency />} />
              <Route path="/competency-domain" element={<CompetencyDomain />} />

              {/* Job Profiling */}
              <Route path="/job" element={<Job />} />
              <Route path="/job-competency-profile" element={<JobCompetencyProfile />} />

              {/* Assessment Management */}
              <Route path="/employee-assessment" element={<EmployeeAssessment />} />
              <Route path="/assessor-assessment" element={<AssessorAssessment />} />
              <Route path="/consensus-assessment" element={<ConsensusAssessment />} />

              {/* Analytics */}
              <Route path="/individual-gap" element={<IndividualGap />} />
              <Route path="/organization-gap" element={<OrganizationGap />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
