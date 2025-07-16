import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import bcrypt from "bcryptjs";

export default function OrganizationSignUp() {
  const [orgName, setOrgName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!orgName || !logoFile || !email || !password) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }
    try {
      // 1. Hash password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      // 2. Upload logo
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
      // 3. Insert organization record
      let websiteToSubmit = website;
      if (websiteToSubmit && !/^https?:\/\//i.test(websiteToSubmit)) {
        websiteToSubmit = 'https://' + websiteToSubmit;
      }
      const { error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: orgName,
          company_size: companySize,
          logo_url: logoUrl,
          website: websiteToSubmit,
          address,
          email,
          password_hash: passwordHash,
          contact_phone: contactPhone
        }]);
      if (orgError) throw orgError;
      // 4. Redirect to organization dashboard
      navigate("/organization/dashboard");
    } catch (err: any) {
      setError(err.message || 'Failed to sign up organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Organization Sign Up</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Name *</label>
          <input type="text" className="w-full border px-3 py-2 rounded mb-4" value={orgName} onChange={e => setOrgName(e.target.value)} required />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Size</label>
          <input type="text" className="w-full border px-3 py-2 rounded mb-4" value={companySize} onChange={e => setCompanySize(e.target.value)} />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Logo *</label>
          <input type="file" accept="image/*" required className="w-full" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Website</label>
          <input type="url" className="w-full border px-3 py-2 rounded mb-4" placeholder="e.g. https://digital.com.ng" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Address</label>
          <input type="text" className="w-full border px-3 py-2 rounded mb-4" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Email *</label>
          <input type="email" className="w-full border px-3 py-2 rounded mb-4" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Password *</label>
          <input type="password" className="w-full border px-3 py-2 rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Confirm Password *</label>
          <input type="password" className="w-full border px-3 py-2 rounded mb-4" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 font-medium text-gray-900 dark:text-white">Contact Phone</label>
          <input type="tel" className="w-full border px-3 py-2 rounded mb-4" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
        </div>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded mt-4" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
} 