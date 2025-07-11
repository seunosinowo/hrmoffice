import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import { supabase } from "../../lib/supabase";
// import { useAuth } from "../../context/AuthContext";
import bcrypt from "bcryptjs";

type SignUpType = 'individual' | 'organization';

export default function SignUp() {
  const [signUpType, setSignUpType] = useState<SignUpType>('individual');
  // Shared
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Remove unused 'signUp' from useAuth
  // const { signUp } = useAuth();

  // Individual
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Organization
  const [orgName, setOrgName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPassword, setOrgPassword] = useState("");
  const [orgConfirmPassword, setOrgConfirmPassword] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Organization selection for individual sign-up
  // Remove unused organization state and fetching
  // const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  // const [selectedOrgId, setSelectedOrgId] = useState("");

  // useEffect(() => {
  //   // Fetch organizations for the dropdown
  //   supabase.from('organizations').select('id, name').then(({ data }) => setOrgs(data || []));
  // }, []);

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      // Sign up logic (update as needed for your auth system)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      // Save organization_id and role in user profile (if using a profile table)
      // await supabase.from('users').update({ organization_id: selectedOrgId, role: 'employee' }).eq('email', email);
      navigate("/auth/email-confirmation", {
        state: {
          message: "Please check your email for the confirmation link. If you don't see it, check your spam folder."
        }
      });
    } catch (error: any) {
        setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (orgPassword !== orgConfirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!orgName || !logoFile || !orgEmail || !orgPassword) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }
    try {
      // Normalize organization email for consistency
      const normalizedEmail = orgEmail.trim().toLowerCase();
      // 1. Hash password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(orgPassword, salt);
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
      // Check if organization email already exists
      // const { data: existingOrg, error: checkOrgError } = await supabase
      //   .from('organizations')
      //   .select('id')
      //   .eq('email', normalizedEmail)
      //   .single();
      // if (existingOrg) {
      //   setError('An organization with this email already exists.');
      //   setLoading(false);
      //   return;
      // }
      // Insert new organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: orgName,
          company_size: companySize,
          logo_url: logoUrl,
          website: websiteToSubmit,
          address,
          email: normalizedEmail,
          password_hash: passwordHash,
          contact_phone: contactPhone
        }]);
      if (orgError) throw orgError;
      // Navigate to dashboard after successful sign up
      navigate("/organization/dashboard");
    } catch (err: any) {
      setError(err.message || 'Failed to sign up organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ← Back to Dashboard
          </Link>
          <ThemeToggleButton />
        </div>
        <div className="flex space-x-2 mb-6">
              <button
                type="button"
                onClick={() => setSignUpType('individual')}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                  signUpType === 'individual'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    signUpType === 'individual'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Individual</span>
                </div>
              </button>
              {/* Organization sign up card/button */}
              {/* <button
                type="button"
                onClick={() => setSignUpType('organization')}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                  signUpType === 'organization'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    signUpType === 'organization'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Organization</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sign up as organization</span>
                </div>
              </button> */}
            </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {signUpType === 'individual' ? 'Sign up as Individual' : 'Sign up as Organization'}
          </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Please fill in your details below to create your account
                </p>
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
        {signUpType === 'individual' ? (
          <form className="mt-8 space-y-6" onSubmit={handleIndividualSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                  placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                  name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                  placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              {/* <div>
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization *</label>
                <select
                  className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  value={selectedOrgId}
                  onChange={e => setSelectedOrgId(e.target.value)}
                  required
                >
                  <option value="">Select Organization</option>
                  {orgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div> */}
            </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    "Create account"
                  )}
                </button>
                <div className="mt-4 text-center">
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleOrganizationSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Name *</label>
                <input type="text" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={orgName} onChange={e => setOrgName(e.target.value)} required />
              </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Size</label>
                <input type="text" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={companySize} onChange={e => setCompanySize(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Organization Logo *</label>
                <input type="file" accept="image/*" required className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white bg-white dark:bg-gray-800" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
              </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Website</label>
                <input type="url" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" placeholder="e.g. https://digital.com.ng" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Address</label>
                <input type="text" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Email *</label>
                <input type="email" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} required />
                  </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Password *</label>
                <input type="password" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={orgPassword} onChange={e => setOrgPassword(e.target.value)} required />
                </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Confirm Password *</label>
                <input type="password" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={orgConfirmPassword} onChange={e => setOrgConfirmPassword(e.target.value)} required />
                </div>
              <div className="col-span-1">
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">Contact Phone</label>
                <input type="tel" className="w-full border px-3 py-2 rounded mb-4 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded mt-2" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
            </form>
          )}
        <div className="mt-4 text-center">
          {/* Organization links at the bottom */}
          {/* <Link
            to="/auth/org-signup"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign up as an Organization (no email confirmation)
          </Link>
          <div className="mt-2">
            <Link
              to="/auth/org-login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Organization Login
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}