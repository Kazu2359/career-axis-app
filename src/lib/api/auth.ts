import { createClient } from "@/lib/supabase/server";

/** ルートハンドラ内で認証済みユーザーを取得する。未認証ならnullを返す。 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
