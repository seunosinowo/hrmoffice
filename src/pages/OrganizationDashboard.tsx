import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

interface Organization {
  id: string;
  name: string;
  logo_url: string;
  industry?: string;
  company_size?: string;
  website?: string;
  address?: string;
  email?: string;
  contact_phone?: string;
}
interface Employee {
  id: string;
  name: string;
  email: string;
}
interface Assessor {
  id: string;
  name: string;
  email: string;
}

export default function OrganizationDashboard() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrgAndPeople() {
      setLoading(true);
      const orgEmailRaw = localStorage.getItem('orgEmail');
      const orgEmail = orgEmailRaw ? orgEmailRaw.trim().toLowerCase() : null;
      if (orgEmail) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("email", orgEmail)
          .single();
        setOrg(orgData || null);
        if (orgData) {
          // Fetch employees from users table
          const { data: empData } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("organization_id", orgData.id)
            .eq("role", "employee");
          setEmployees(empData || []);
          // Fetch assessors from users table
          const { data: assData } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("organization_id", orgData.id)
            .eq("role", "assessor");
          setAssessors(assData || []);
        } else {
          setEmployees([]);
          setAssessors([]);
        }
      } else {
        setOrg(null);
        setEmployees([]);
        setAssessors([]);
      }
      setLoading(false);
    }
    fetchOrgAndPeople();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  if (!org) {
    // Show welcome UI for users with no org yet
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
        <div className="w-full flex justify-between items-center mb-4">
          <button onClick={() => navigate("/")} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition">Go to Home</button>
          <ThemeToggleButton />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10 max-w-xl w-full flex flex-col items-center">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">Welcome to HRM Office!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Get started by creating your organization or adding people to your HR dashboard.
          </p>
          <div className="flex flex-col md:flex-row gap-4 w-full mb-6">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded shadow transition" onClick={() => navigate('/auth/org-login')}>Login as Organization</button>
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow transition">Add People</button>
          </div>
          <div className="mt-4 text-left w-full">
            <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">What can you do?</h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-1">
              <li>Manage employees and assessors</li>
              <li>Track competencies and performance</li>
              <li>Run and review assessments</li>
              <li>Customize your organization profile</li>
            </ul>
            <div className="mt-4">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition" onClick={() => navigate('/auth/login')}>Go to General Dashboard</button>
            </div>
            <div className="mt-4 text-blue-700 dark:text-blue-300 font-semibold">
              Are you an individual? <button className="underline" onClick={() => navigate('/auth/signup')}>Link yourself to an organization</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Revamped org info card
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full flex justify-between items-center mb-4">
        <button onClick={() => navigate("/")} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition">Go to Home</button>
        <ThemeToggleButton />
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition" onClick={() => navigate('/auth/login')}>Go to General Dashboard</button>
      </div>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 mb-10 flex flex-col md:flex-row items-center gap-10 border border-blue-100 dark:border-gray-700">
        {org.logo_url && (
          <img src={org.logo_url} alt="Organization Logo" className="h-32 w-32 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-white shadow-lg" />
        )}
        <div className="flex-1">
          <h2 className="text-4xl font-extrabold text-blue-700 dark:text-blue-300 mb-4">{org.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-gray-700 dark:text-gray-200 text-lg">
            {org.industry && <div><span className="font-semibold">Industry:</span> {org.industry}</div>}
            {org.company_size && <div><span className="font-semibold">Company Size:</span> {org.company_size}</div>}
            {org.website && <div><span className="font-semibold">Website:</span> <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{org.website}</a></div>}
            {org.address && <div><span className="font-semibold">Address:</span> {org.address}</div>}
            {org.email && <div><span className="font-semibold">Email:</span> {org.email}</div>}
            {org.contact_phone && <div><span className="font-semibold">Contact Phone:</span> {org.contact_phone}</div>}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Employees</h3>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mb-8">
          {employees.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No employees yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {employees.map(emp => (
                <li key={emp.id} className="py-2 flex justify-between items-center">
                  <span>{emp.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{emp.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Assessors</h3>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          {assessors.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No assessors yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {assessors.map(ass => (
                <li key={ass.id} className="py-2 flex justify-between items-center">
                  <span>{ass.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{ass.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-8 text-center">
          <div className="text-blue-700 dark:text-blue-300 font-semibold">
            Are you an individual? <button className="underline" onClick={() => navigate('/auth/signup')}>Link yourself to an organization</button>
          </div>
        </div>
      </div>
    </div>
  );
} 