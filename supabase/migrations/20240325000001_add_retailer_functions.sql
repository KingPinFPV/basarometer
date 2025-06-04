-- Add new retailer (simple version)
CREATE OR REPLACE FUNCTION add_retailer_simple(
  p_name text,
  p_type text,
  p_website_url text DEFAULT NULL
) RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR p_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required fields'
    );
  END IF;

  -- Validate retailer type
  IF p_type NOT IN ('supermarket', 'butcher', 'market', 'online') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid retailer type'
    );
  END IF;

  -- Check if retailer already exists
  IF EXISTS (SELECT 1 FROM retailers WHERE name = p_name) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Retailer with this name already exists'
    );
  END IF;

  -- Insert new retailer
  INSERT INTO retailers (
    name,
    type,
    website_url,
    is_chain,
    is_active
  ) VALUES (
    p_name,
    p_type,
    p_website_url,
    true, -- Default to chain store
    true  -- Active by default
  )
  RETURNING id INTO v_new_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'retailer_id', v_new_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql; 