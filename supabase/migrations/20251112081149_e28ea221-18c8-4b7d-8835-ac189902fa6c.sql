-- Create function to count total users
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM auth.users;
$$;

-- Create function to check user limit before signup
CREATE OR REPLACE FUNCTION public.check_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If we already have 10 or more users, prevent the insert
  IF user_count >= 10 THEN
    RAISE EXCEPTION 'User registration limit reached. Maximum 10 users allowed.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to enforce limit
CREATE TRIGGER enforce_user_limit
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.check_user_limit();