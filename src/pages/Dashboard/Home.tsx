import HRMetrics from "../AllDashboard/HRMetrics";
import EmployeeDistributionChart from "../AllDashboard/EmployeeDistributionChart";
import PerformanceStatistics from "../AllDashboard/PerformanceStatistics";
import CompetencyGapAnalysis from "../AllDashboard/CompetencyGapAnalysis";
import RecentActivities from "../AllDashboard/RecentActivities";
import PageMeta from "../../components/common/PageMeta";

export default function HRDashboard() {
  return (
    <>
      <PageMeta
        title="HR Management System"
        description="Comprehensive HR analytics and employee management dashboard with performance metrics, competency analysis, and activity tracking"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <HRMetrics />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EmployeeDistributionChart />
            <CompetencyGapAnalysis />
          </div>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-4">
          <div className="sticky top-6 space-y-6">
            <PerformanceStatistics />
            <RecentActivities />
          </div>
        </div>
      </div>
    </>
  );
}