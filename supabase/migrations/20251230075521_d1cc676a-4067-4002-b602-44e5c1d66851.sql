-- Create a function to automatically assign admin role to specific emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email should be auto-assigned admin role
  IF LOWER(NEW.email) IN ('andrew@clublesscollective.com', 'rio@clublesscollective.com') THEN
    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the assignment for audit
    INSERT INTO public.error_logs (event_type, user_email, user_id, details)
    VALUES (
      'admin_role_auto_assigned',
      NEW.email,
      NEW.id,
      jsonb_build_object('assigned_at', now(), 'method', 'auto_trigger')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();