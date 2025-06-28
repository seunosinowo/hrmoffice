import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import OrganizationDashboard from "./OrganizationDashboard";

export default function OrganizationDashboardWrapper() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgId() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch organization by user.email
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("email", user.email)
          .single();
        if (org) setOrgId(org.id);
      }
      setLoading(false);
    }
    fetchOrgId();
  }, []);

  if (loading) return <div>Loading organization...</div>;
  if (!orgId) return <div>Organization not found for this user.</div>;
  return <OrganizationDashboard orgId={orgId} />;
} 