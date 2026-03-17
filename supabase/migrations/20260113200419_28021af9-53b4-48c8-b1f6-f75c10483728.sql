-- Add CHECK constraint to prevent overselling (using trigger since CHECK can't reference multiple columns dynamically)
-- Create a validation trigger instead of CHECK constraint for better flexibility

-- Create atomic ticket reservation function with row-level locking
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_ticket_id UUID,
  p_quantity INTEGER,
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_ticket RECORD;
BEGIN
  -- Validate inputs
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  -- Lock the ticket row for update to prevent race conditions
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- Calculate available tickets
  v_available := v_ticket.qty_total - v_ticket.qty_sold - v_ticket.qty_reserved;

  -- Check availability
  IF p_quantity > v_available THEN
    RAISE EXCEPTION 'Not enough tickets available. Requested: %, Available: %', p_quantity, v_available;
  END IF;

  -- Update reserved count atomically
  UPDATE public.tickets
  SET qty_reserved = qty_reserved + p_quantity,
      updated_at = now()
  WHERE id = p_ticket_id;

  RETURN TRUE;
END;
$$;

-- Create function to release reservations (for cancelled/expired orders)
CREATE OR REPLACE FUNCTION public.release_ticket_reservations(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_line_item RECORD;
BEGIN
  -- Get the order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Only release if order is pending or cancelled
  IF v_order.status NOT IN ('pending', 'cancelled', 'failed') THEN
    RETURN FALSE;
  END IF;

  -- Release reservations for each line item
  FOR v_line_item IN 
    SELECT * FROM jsonb_to_recordset(v_order.line_items_json::jsonb) 
    AS x(ticket_id UUID, quantity INTEGER)
  LOOP
    UPDATE public.tickets
    SET qty_reserved = GREATEST(0, qty_reserved - v_line_item.quantity),
        updated_at = now()
    WHERE id = v_line_item.ticket_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Create function to confirm ticket sale (moves from reserved to sold)
CREATE OR REPLACE FUNCTION public.confirm_ticket_sale(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_line_item RECORD;
BEGIN
  -- Get the order with lock
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Only confirm if order is pending or processing
  IF v_order.status NOT IN ('pending', 'processing') THEN
    RETURN FALSE;
  END IF;

  -- Move from reserved to sold for each line item
  FOR v_line_item IN 
    SELECT * FROM jsonb_to_recordset(v_order.line_items_json::jsonb) 
    AS x(ticket_id UUID, quantity INTEGER)
  LOOP
    UPDATE public.tickets
    SET qty_reserved = GREATEST(0, qty_reserved - v_line_item.quantity),
        qty_sold = qty_sold + v_line_item.quantity,
        updated_at = now()
    WHERE id = v_line_item.ticket_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Add trigger to validate ticket availability on update
CREATE OR REPLACE FUNCTION public.validate_ticket_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Ensure qty_sold + qty_reserved doesn't exceed qty_total
  IF (NEW.qty_sold + NEW.qty_reserved) > NEW.qty_total THEN
    RAISE EXCEPTION 'Cannot exceed total ticket quantity. Total: %, Sold: %, Reserved: %', 
      NEW.qty_total, NEW.qty_sold, NEW.qty_reserved;
  END IF;
  
  -- Ensure values are non-negative
  IF NEW.qty_sold < 0 OR NEW.qty_reserved < 0 THEN
    RAISE EXCEPTION 'Ticket quantities cannot be negative';
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_ticket_availability_trigger ON public.tickets;
CREATE TRIGGER validate_ticket_availability_trigger
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticket_availability();

-- Add reservation_expires_at column to orders for tracking expiration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMPTZ;

-- Create index for finding expired reservations
CREATE INDEX IF NOT EXISTS idx_orders_reservation_expires 
  ON public.orders(reservation_expires_at) 
  WHERE status = 'pending' AND reservation_expires_at IS NOT NULL;