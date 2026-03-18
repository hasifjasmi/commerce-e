import { SuccessView } from "./success-view";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SuccessPage(props: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const params = await Promise.resolve(props.searchParams ?? ({} as SearchParams));
  const raw = params.session_id;
  const sessionId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return <SuccessView sessionId={sessionId} />;
}
