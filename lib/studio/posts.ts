// Content Studio — saved posts.
//
// Server-only. Uses the Supabase service client, the same as every other admin
// read in this repo (content_posts has RLS on with no policies, so the anon key
// deliberately sees nothing).

import { createSupabaseServiceClient } from '@/lib/supabase/client';

export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'archived';

export const POST_STATUSES: PostStatus[] = ['draft', 'scheduled', 'posted', 'archived'];

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  posted: 'Posted',
  archived: 'Archived',
};

export type ContentPost = {
  id: string;
  template_id: string;
  title: string;
  status: PostStatus;
  scheduled_for: string | null;
  posted_at: string | null;
  props: Record<string, unknown>;
  caption: string;
  brand: string;
  created_at: string;
  updated_at: string;
};

/** The subset a create/update accepts. Ids and timestamps are the DB's job. */
export type PostInput = {
  template_id: string;
  title?: string;
  status?: PostStatus;
  scheduled_for?: string | null;
  posted_at?: string | null;
  props?: Record<string, unknown>;
  caption?: string;
  brand?: string;
};

const COLUMNS =
  'id, template_id, title, status, scheduled_for, posted_at, props, caption, brand, created_at, updated_at';

export function normalizeStatus(value: unknown): PostStatus {
  return POST_STATUSES.includes(value as PostStatus) ? (value as PostStatus) : 'draft';
}

export async function listPosts(): Promise<ContentPost[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('content_posts')
    .select(COLUMNS)
    // Scheduled work first and in date order; everything undated falls to the
    // bottom by recency. Postgres sorts NULLs last on ASC by default, which is
    // exactly the wanted shape for a queue.
    .order('scheduled_for', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ContentPost[];
}

export async function getPost(id: string): Promise<ContentPost | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('content_posts')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ContentPost | null) ?? null;
}

export async function createPost(input: PostInput): Promise<ContentPost> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('content_posts')
    .insert({
      template_id: input.template_id,
      title: input.title ?? '',
      status: normalizeStatus(input.status),
      scheduled_for: input.scheduled_for ?? null,
      props: input.props ?? {},
      caption: input.caption ?? '',
      brand: input.brand ?? 'townies',
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as ContentPost;
}

/** Insert many in one round trip — the "generate the week" batch. */
export async function createPosts(inputs: PostInput[]): Promise<ContentPost[]> {
  if (inputs.length === 0) return [];
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('content_posts')
    .insert(
      inputs.map((input) => ({
        template_id: input.template_id,
        title: input.title ?? '',
        status: normalizeStatus(input.status),
        scheduled_for: input.scheduled_for ?? null,
        props: input.props ?? {},
        caption: input.caption ?? '',
        brand: input.brand ?? 'townies',
      }))
    )
    .select(COLUMNS);

  if (error) throw new Error(error.message);
  return (data ?? []) as ContentPost[];
}

export async function updatePost(id: string, patch: Partial<PostInput>): Promise<ContentPost> {
  const supabase = createSupabaseServiceClient();

  // Only send keys the caller actually supplied. Spreading the whole object
  // would blank scheduled_for on any save that didn't mention it.
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.status !== undefined) update.status = normalizeStatus(patch.status);
  if (patch.scheduled_for !== undefined) update.scheduled_for = patch.scheduled_for;
  if (patch.posted_at !== undefined) update.posted_at = patch.posted_at;
  if (patch.props !== undefined) update.props = patch.props;
  if (patch.caption !== undefined) update.caption = patch.caption;
  if (patch.brand !== undefined) update.brand = patch.brand;

  const { data, error } = await supabase
    .from('content_posts')
    .update(update)
    .eq('id', id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as ContentPost;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('content_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
