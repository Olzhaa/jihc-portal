import { Events } from "@/components/curator/events";
import { CuratorWorkspace } from "../workspace";

export default async function CuratorEvents({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  return <CuratorWorkspace groupId={g}><Events /></CuratorWorkspace>;
}
