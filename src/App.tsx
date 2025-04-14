import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

import PageDescription from "./pages/PageDescription/PageDescription";

import User from "./pages/User_and_role_management/User";
import Employee from "./pages/User_and_role_management/Employee";
import EmployeeJobAssignment from "././pages/User_and_role_management/EmployeeJobAssignment";
import EmployeeAssessorAssign from "././pages/User_and_role_management/EmployeeAssessorAssign";

import OrganizationUnit from "./pages/Organizational_structure/Organization_unit";
import Discipline from "./pages/Organizational_structure/Discipline";
import OrganizationCompetency from "./pages/Organizational_structure/Organisation_competency";

import CompetencyCategory from "./pages/Competency_framework/CompetencyCategory";
import CompetencyDomain from "./pages/Competency_framework/CompetencyDomain";
import ProficiencyLevel from "./pages/Competency_framework/ProficiencyLevel";
import Competency from "./pages/Competency_framework/Competency";
import CompetencyProficiencyDescription from "./pages/Competency_framework/CompetencyProficiencyDescription";

import Job from "./pages/Job_profiling/Job";
import JobCompetencyProfile from "./pages/Job_profiling/JobCompetencyProfile";

import EmployeeAssessment from "./pages/Assessment_management/EmployeeAssessment";
import AssessorAssessment from "./pages/Assessment_management/AssessorAssessment";
import ConsensusAssessment from "./pages/Assessment_management/ConsensusAssessment";

import IndividualGap from "./pages/Analytics/IndividualGap";
import OrganizationGap from "./pages/Analytics/OrganizationGap";

import Home from "./pages/Dashboard/Home";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />

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

            {/* Page Description */}
            <Route path="/page-description" element={<PageDescription />} />

            {/* User and Role Management */}
            <Route path="/user" element={<User />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/employee-job-assignment" element={<EmployeeJobAssignment />} />
            <Route path="/employee-assessor-assign" element={<EmployeeAssessorAssign />} />

            {/* Organizational Structure */}
            <Route path="/organization-unit" element={<OrganizationUnit />} />
            <Route path="/discipline" element={<Discipline />} />
            <Route path="/organization-competency" element={<OrganizationCompetency />} />

            {/* Competency Framework */}
            <Route path="/competency-category" element={<CompetencyCategory />} />
            <Route path="/competency-domain" element={<CompetencyDomain />} />
            <Route path="/proficiency-level" element={<ProficiencyLevel />} />
            <Route path="/competency" element={<Competency />} />
            <Route path="/competency-proficiency-description" element={<CompetencyProficiencyDescription />} />

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

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
