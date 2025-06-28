import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Organization {
  id: string;
  name: string;
  company_size: string;
  logo_url: string;
  website: string;
  address: string;
  email: string;
  contact_phone: string;
}

interface Props {
  orgId: string;
}

export default function OrganizationDashboard({ orgId }: Props) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrg() {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();
      if (error) {
        setError("Organization not found or error fetching data.");
        setOrg(null);
      } else {
        setOrg(data);
      }
      setLoading(false);
    }
    if (orgId) fetchOrg();
  }, [orgId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!org) return <div>Organization not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <img src={org.logo_url} alt="Logo" className="h-24 mb-4 object-contain" />
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{org.name}</h2>
      <p className="mb-1"><strong>Size:</strong> {org.company_size}</p>
      <p className="mb-1"><strong>Website:</strong> <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{org.website}</a></p>
      <p className="mb-1"><strong>Address:</strong> {org.address}</p>
      <p className="mb-1"><strong>Email:</strong> {org.email}</p>
      <p className="mb-1"><strong>Contact Phone:</strong> {org.contact_phone}</p>
    </div>
  );
} 