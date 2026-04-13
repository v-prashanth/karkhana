import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid'; // If nanoid isn't available, we'll use crypto.randomUUID()

/**
 * Sharing API
 * Manages secure document tokens and viral growth loops.
 */
export const sharingApi = {
  /**
   * Create a secure shareable link for a document
   */
  async createShareLink(docId: string, docType: 'invoice' | 'dc' | 'quotation', expiresDays?: number) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = expiresDays ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data, error } = await supabase
      .from('shared_documents')
      .insert({
        organization_id: (session.user as any).organization_id || (await this.getOrgId(session.user.id)),
        document_id: docId,
        document_type: docType,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      token,
      url: `${window.location.origin}/doc/${token}`,
    };
  },

  /**
   * Helper to fetch Org ID from profile if not in session metadata
   */
  async getOrgId(userId: string) {
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
    return data?.organization_id;
  },

  /**
   * Fetch a document by its secret token (Public Access)
   */
  async getDocByToken(token: string) {
    const supabase = createClient();
    
    // 1. Get token record
    const { data: tokenData, error: tokenError } = await supabase
      .from('shared_documents')
      .select('*, organizations(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) throw new Error("Document link is invalid or expired");

    // 2. Log View (Audit Log & Counter)
    await supabase.rpc('increment_view_count', { token_id: tokenData.id });
    
    // 3. Get actual document data
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', tokenData.document_id)
      .single();

    if (docError) throw docError;

    return {
      document: docData,
      organization: tokenData.organizations,
      meta: tokenData
    };
  },

  /**
   * Send a connection request to another business
   */
  async sendConnectionRequest(targetOrgId: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const myOrgId = await this.getOrgId(session.user.id);
    if (!myOrgId) throw new Error("Organization profile not found");

    const { data, error } = await supabase
      .from('business_connections')
      .insert({
        requester_org_id: myOrgId,
        receiver_org_id: targetOrgId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch documents received from other businesses (Buyer Inbox)
   */
  async getReceivedDocs() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const myOrgId = await this.getOrgId(session.user.id);
    
    const { data, error } = await supabase
      .from('received_documents')
      .select('*, from_organization:organizations(*), shared_document:shared_documents(*)')
      .eq('organization_id', myOrgId)
      .order('received_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
