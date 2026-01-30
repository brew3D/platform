-- Run this on your Supabase project if the Flow page fails to load/save with
-- "Failed to load flow from API" / "Failed to save flow to backend".
-- Cause: RLS was enabled on flow tables but no policies existed (default deny).

-- project_flows
DROP POLICY IF EXISTS "Allow flow read" ON project_flows;
CREATE POLICY "Allow flow read" ON project_flows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow flow insert" ON project_flows;
CREATE POLICY "Allow flow insert" ON project_flows FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow flow update" ON project_flows;
CREATE POLICY "Allow flow update" ON project_flows FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow flow delete" ON project_flows;
CREATE POLICY "Allow flow delete" ON project_flows FOR DELETE USING (true);

-- flow_nodes
DROP POLICY IF EXISTS "Allow flow nodes read" ON flow_nodes;
CREATE POLICY "Allow flow nodes read" ON flow_nodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow flow nodes insert" ON flow_nodes;
CREATE POLICY "Allow flow nodes insert" ON flow_nodes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow flow nodes update" ON flow_nodes;
CREATE POLICY "Allow flow nodes update" ON flow_nodes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow flow nodes delete" ON flow_nodes;
CREATE POLICY "Allow flow nodes delete" ON flow_nodes FOR DELETE USING (true);

-- flow_edges
DROP POLICY IF EXISTS "Allow flow edges read" ON flow_edges;
CREATE POLICY "Allow flow edges read" ON flow_edges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow flow edges insert" ON flow_edges;
CREATE POLICY "Allow flow edges insert" ON flow_edges FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow flow edges update" ON flow_edges;
CREATE POLICY "Allow flow edges update" ON flow_edges FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow flow edges delete" ON flow_edges;
CREATE POLICY "Allow flow edges delete" ON flow_edges FOR DELETE USING (true);

-- flow_startpoints
DROP POLICY IF EXISTS "Allow flow startpoints read" ON flow_startpoints;
CREATE POLICY "Allow flow startpoints read" ON flow_startpoints FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow flow startpoints insert" ON flow_startpoints;
CREATE POLICY "Allow flow startpoints insert" ON flow_startpoints FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow flow startpoints update" ON flow_startpoints;
CREATE POLICY "Allow flow startpoints update" ON flow_startpoints FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow flow startpoints delete" ON flow_startpoints;
CREATE POLICY "Allow flow startpoints delete" ON flow_startpoints FOR DELETE USING (true);
