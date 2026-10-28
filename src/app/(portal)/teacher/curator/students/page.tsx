import { Students } from "@/components/curator/students";
import { CuratorWorkspace } from "../workspace";

export default async function CuratorStudents({ searchParams }: { searchParams: Promise<{ g?: string; filter?: string }> }) {
  const { g, filter } = await searchParams;
  return <CuratorWorkspace groupId={g}><Students initialFilter={filter} /></CuratorWorkspace>;
}
