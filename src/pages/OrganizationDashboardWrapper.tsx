import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import OrganizationDashboard from "./OrganizationDashboard";

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

export default function OrganizationDashboardWrapper() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      setLoading(true);
      const orgEmailRaw = localStorage.getItem('orgEmail');
      const orgEmail = orgEmailRaw ? orgEmailRaw.trim().toLowerCase() : null;
      console.log('[Org Dashboard] Looking up organization with email:', orgEmail);
      if (orgEmail) {
        const { data } = await supabase
          .from("organizations")
          .select("id, name, logo_url, industry, company_size, website, address, email, contact_phone")
          .eq("email", orgEmail)
          .single();
        setOrg(data || null);
      } else {
        setOrg(null);
      }
      setLoading(false);
    }
    fetchOrg();
  }, []);

  if (loading) return <div>Loading...</div>;
  // Always render dashboard, even if org is null
  return <OrganizationDashboard org={org} />;
} 