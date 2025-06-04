-- Get meat categories for form
CREATE OR REPLACE FUNCTION get_meat_categories_for_form()
RETURNS TABLE (
  id uuid,
  name_hebrew text,
  name_english text,
  display_order integer
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.name_hebrew,
    mc.name_english,
    mc.display_order
  FROM meat_categories mc
  WHERE mc.is_active = true
  ORDER BY mc.display_order;
END;
$$ LANGUAGE plpgsql;

-- Add new meat cut (simple version)
CREATE OR REPLACE FUNCTION add_meat_cut_simple(
  p_category_id uuid,
  p_name_hebrew text,
  p_name_english text
) RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  v_new_id uuid;
  v_display_order integer;
BEGIN
  -- Validate inputs
  IF p_category_id IS NULL OR p_name_hebrew IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required fields'
    );
  END IF;

  -- Get next display order for the category
  SELECT COALESCE(MAX(display_order), 0) + 1
  INTO v_display_order
  FROM meat_cuts
  WHERE category_id = p_category_id;

  -- Insert new meat cut
  INSERT INTO meat_cuts (
    category_id,
    name_hebrew,
    name_english,
    display_order,
    is_active,
    is_popular
  ) VALUES (
    p_category_id,
    p_name_hebrew,
    p_name_english,
    v_display_order,
    true,
    false
  )
  RETURNING id INTO v_new_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'meat_cut_id', v_new_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql; 