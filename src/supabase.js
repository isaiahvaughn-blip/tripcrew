import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://pkrymzcjfsioazapllwl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcnltemNqZnNpb2F6YXBsbHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mjc5NjEsImV4cCI6MjA5MjMwMzk2MX0.GYOFFsS2pDDPu_8VkLOOxL3fHc-NquOeOQxnAlYSfh8'
)