// JavaScript function to check current user and roles
// Run this in your browser console when logged in to your application

async function checkUserAndRoles() {
  console.log("Checking current user and roles...");
  
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }
    
    if (!userData || !userData.user) {
      console.log("No user is currently logged in");
      return;
    }
    
    console.log("Current user:", userData.user);
    
    // Check user_role_assignments table
    console.log("Checking user_role_assignments table...");
    
    // First, let's check the structure of the table
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_role_assignments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error accessing user_role_assignments table:", tableError);
    } else {
      console.log("user_role_assignments table structure:", tableInfo);
      
      // Now get the current user's roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', userData.user.id);
      
      if (rolesError) {
        console.error("Error getting user roles:", rolesError);
      } else {
        console.log("User roles:", roles);
      }
    }
    
    // Test access to competency_proficiencies table
    console.log("Testing access to competency_proficiencies table...");
    
    // Try to read from the table
    const { data: readData, error: readError } = await supabase
      .from('competency_proficiencies')
      .select('count(*)')
      .single();
    
    if (readError) {
      console.error("Error reading from competency_proficiencies:", readError);
    } else {
      console.log("Successfully read from competency_proficiencies:", readData);
    }
    
    // Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('competency_proficiencies')
      .insert([{
        competency_name: "Test Competency",
        proficiency_level: "Test Level",
        description: "Test Description"
      }])
      .select();
    
    if (insertError) {
      console.error("Error inserting into competency_proficiencies:", insertError);
    } else {
      console.log("Successfully inserted into competency_proficiencies:", insertData);
      
      // Clean up the test record
      if (insertData && insertData[0] && insertData[0].id) {
        const { error: deleteError } = await supabase
          .from('competency_proficiencies')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error("Error deleting test record:", deleteError);
        } else {
          console.log("Successfully deleted test record");
        }
      }
    }
    
  } catch (err) {
    console.error("Error checking user and roles:", err);
  }
}

// Run the function
// checkUserAndRoles();

console.log("To check your user and roles, run checkUserAndRoles() in your console.");
