/**
 * Admin authentication and authorization utilities
 */

/**
 * Check if a user has admin privileges
 * @param {Object} supabase - Supabase client instance
 * @param {string} userId - User ID to check
 * @returns {Promise<{isAdmin: boolean, role: string|null}>}
 */
export async function checkAdminStatus(supabase, userId) {
  if (!userId) {
    console.warn('[AdminAuth] No userId provided for admin check');
    return { isAdmin: false, role: null };
  }

  try {
    console.log(`[AdminAuth] Checking admin status for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[AdminAuth] Admin check query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      });
      return { isAdmin: false, role: null };
    }

    if (!data) {
      console.log(`[AdminAuth] User ${userId} is not an admin (no record found)`);
      return { isAdmin: false, role: null };
    }

    console.log(`[AdminAuth] User ${userId} is an admin with role: ${data.role}`);
    return { isAdmin: true, role: data.role };
  } catch (err) {
    console.error('[AdminAuth] Admin check exception:', {
      message: err.message,
      stack: err.stack,
      userId
    });
    return { isAdmin: false, role: null };
  }
}

/**
 * Require admin access (throws error if not admin)
 * @param {Object} supabase - Supabase client instance
 * @param {string} userId - User ID to check
 * @throws {Error} If user is not an admin
 * @returns {Promise<{role: string}>}
 */
export async function requireAdmin(supabase, userId, userEmail = null) {
  if (!userId) {
    const error = new Error('Forbidden: User ID required for admin check');
    error.status = 403;
    console.error('[AdminAuth] requireAdmin called without userId');
    throw error;
  }

  console.log(`[AdminAuth] requireAdmin called for user: ${userId}`);
  
  const { isAdmin, role } = await checkAdminStatus(supabase, userId);

  if (!isAdmin) {
    // Optional fallback: check email-based admin (only if userEmail provided)
    if (userEmail) {
      try {
        // Try to use environment variable if available (server-side only)
        const adminEmails = typeof process !== 'undefined' && process.env?.ADMIN_EMAILS;
        if (adminEmails) {
          const fallback = isAdminByEmail(userEmail, adminEmails);
          if (fallback) {
            console.warn(`[AdminAuth] Fallback admin by email for user: ${userEmail}`);
            return { role: 'admin' };
          }
        }
      } catch (err) {
        // Ignore if process.env is not available (client-side)
      }
    }

    console.warn(`[AdminAuth] Admin access denied for user: ${userId}`);
    const error = new Error('Forbidden: Admin access required');
    error.status = 403;
    throw error;
  }

  console.log(`[AdminAuth] Admin access granted for user: ${userId} with role: ${role}`);
  return { role };
}

/**
 * Environment-based admin check (fallback for initial setup)
 * Only use this during migration period
 * @deprecated Use database-based admin_users table instead
 * @param {string} email - User email to check
 * @param {string} adminEmails - Comma-separated list of admin emails
 * @returns {boolean}
 */
export function isAdminByEmail(email, adminEmails) {
  if (!adminEmails) {
    console.warn('ADMIN_EMAILS environment variable not set');
    return false;
  }

  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase());
  return allowedEmails.includes(email?.toLowerCase());
}
