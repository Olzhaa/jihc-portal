import { Contacts } from "@/components/curator/journal";
import { CuratorWorkspace } from "../workspace";

export default async function CuratorContacts({ searchParams }: { searchParams: Promise<{ g?: string; tab?: string }> }) {
  const { g, tab } = await searchParams;
  return <CuratorWorkspace groupId={g}><Contacts initialTab={tab} /></CuratorWorkspace>;
}
