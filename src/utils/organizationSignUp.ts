import { supabase } from '../lib/supabase';

/**
 * Creates an organization with a logo and an admin user.
 * @param orgName The name of the organization
 * @param logoFile The logo file (File object)
 * @param adminEmail The admin's email
 * @param password The admin's password
 * @returns {Promise<{ org: any, user: any }>} The created organization and user
 */
export async function createOrganizationWithLogo(orgName: string, logoFile: File, adminEmail: string, password: string): Promise<{ org: any, user: any }> {
  // 1. Upload logo to 'organization-logos' bucket
  const fileExt = logoFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('organization-logos')
    .upload(fileName, logoFile);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase
    .storage
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

  // 3. Create admin user (role: 'hr')
  const { data: userData, error: signUpError } = await supabase.auth.signUp({
    email: adminEmail,
    password,
    options: {
      data: {
        organization_id: orgData.id,
        role: 'hr'
      }
    }
  });

  if (signUpError) throw signUpError;

  return { org: orgData, user: userData.user };
} 