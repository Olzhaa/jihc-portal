import { Cycle } from "@/components/curator/cycle";
import { CuratorWorkspace } from "../workspace";

export default async function CuratorCycle({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  return <CuratorWorkspace groupId={g}><Cycle /></CuratorWorkspace>;
}
