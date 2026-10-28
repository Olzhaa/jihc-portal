import { Overview } from "@/components/curator/overview";
import { CuratorWorkspace } from "./workspace";

export default async function CuratorHome({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  return <CuratorWorkspace groupId={g}><Overview /></CuratorWorkspace>;
}
