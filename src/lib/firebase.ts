// ──────────────────────────────────────────────────
// Golden Leaf Finance — Backend Compatibility Adapter
// Replaced with Supabase PostgreSQL & Cloudinary
// ──────────────────────────────────────────────────

export const auth: any = {
  currentUser: null,
  onAuthStateChanged: (_cb: any) => () => {},
  signOut: async () => {},
};

export const db: any = {
  type: 'supabase-postgresql-adapter',
};

export const storage: any = {
  type: 'cloudinary-media-adapter',
};

export const functions: any = null;
export const analytics: any = null;
export const messaging: any = null;

const app: any = {
  name: '[GoldenLeafSupabaseApp]',
  options: {},
};

export default app;
