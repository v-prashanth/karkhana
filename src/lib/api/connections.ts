import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import type { BusinessConnection, Organization } from '@/types/database';

const supabase = createClient();

function getOrgId() {
  return useStore.getState().organization?.id;
}

/**
 * Connections API
 * Manages B2B network connections and discovery.
 */
export const connectionsApi = {
  /**
   * List all active connections for the current organization
   */
  async listActive() {
    const orgId = getOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('business_connections')
      .select(`
        *,
        requester:organizations!requester_org_id(*),
        receiver:organizations!receiver_org_id(*)
      `)
      .or(`requester_org_id.eq.${orgId},receiver_org_id.eq.${orgId}`)
      .eq('status', 'connected');

    if (error) throw error;
    
    // Map to return the "other" organization in the connection
    return data.map(conn => {
      const otherOrg = conn.requester_org_id === orgId ? conn.receiver : conn.requester;
      return { ...conn, organization: otherOrg };
    });
  },

  /**
   * List pending incoming requests
   */
  async listPendingRequests() {
    const orgId = getOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('business_connections')
      .select(`
        *,
        requester:organizations!requester_org_id(*)
      `)
      .eq('receiver_org_id', orgId)
      .eq('status', 'pending');

    if (error) throw error;
    return data;
  },

  /**
   * Send a connection request to another business
   */
  async sendRequest(targetOrgId: string) {
    const orgId = getOrgId();
    if (!orgId) throw new Error("Unauthorized");
    if (orgId === targetOrgId) throw new Error("Cannot connect to yourself");

    const { data, error } = await supabase
      .from('business_connections')
      .insert({
        requester_org_id: orgId,
        receiver_org_id: targetOrgId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error("A request already exists between these businesses");
      throw error;
    }
    return data;
  },

  /**
   * Respond to a pending request (accept/reject)
   */
  async respondToRequest(requestId: string, status: 'connected' | 'declined' | 'blocked') {
    const { data, error } = await supabase
      .from('business_connections')
      .update({ 
        status,
        connected_at: status === 'connected' ? new Date().toISOString() : null
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Search for other businesses on Karkhana
   */
  async discover(query: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, public_slug, business_type, is_verified, logo_url')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  }
};
