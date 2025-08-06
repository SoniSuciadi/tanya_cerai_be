CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
DECLARE
    max_order_id integer;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_id, 9) AS integer)), 0)
    INTO max_order_id
    FROM orders;

    NEW.order_id := 'OR-CER-' || (max_order_id + 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_id
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_id();
