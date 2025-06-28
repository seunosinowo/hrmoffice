import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SetupOrganization() {
  const [orgName, setOrgName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check if the user already has an organization_id
    const checkOrgSetup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && user.user_metadata.organization_id) {
        // If organization_id exists, redirect to dashboard
        navigate('/dashboard');
      }
    };
    checkOrgSetup();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!orgName) {
      setError('Organization name is required');
      setLoading(false);
      return;
    }
    if (!logoFile) {
      setError('Organization logo is required');
      setLoading(false);
      return;
    }
    try {
      // 1. Upload logo (required)
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, logoFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);
      const logoUrl = urlData.publicUrl;
      // 2. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: orgName, logo_url: logoUrl }])
        .select()
        .single();
      if (orgError) throw orgError;
      // 3. Update user with organization_id and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      await supabase
        .from('users')
        .update({ organization_id: orgData.id, role: 'hr' })
        .eq('id', user.id);
      // 4. Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set up organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Set Up Your Organization</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Organization Name</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          placeholder="Organization Name"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Logo <span className="text-red-500">*</span></label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={e => setLogoFile(e.target.files?.[0] || null)}
        />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
        {loading ? 'Setting up...' : 'Create Organization'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 