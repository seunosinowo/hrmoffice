import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function CompetencyGapAnalysis() {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
    },
    colors: ["#10B981", "#F59E0B", "#EF4444"],
    labels: ["Met", "Partially Met", "Not Met"],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              color: "#6B7280",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: "bold",
              color: "#111827",
              formatter: function (val) {
                return val + "%";
              },
            },
            total: {
              show: true,
              label: "Competency Gap",
              formatter: function () {
                return "22%";
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const series = [65, 20, 15];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Competency Gap Analysis
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Current vs required competency levels
      </p>

      <div className="mt-6">
        <Chart options={options} series={series} type="donut" height={300} />
      </div>
    </div>
  );
}