import { StudentPage } from "@/components/curator/students";
import { CuratorWorkspace } from "../../workspace";

export default async function CuratorStudent({ searchParams }: { searchParams: Promise<{ g?: string; id?: string }> }) {
  const { g, id } = await searchParams;
  return <CuratorWorkspace groupId={g}><StudentPage studentId={id ?? null} /></CuratorWorkspace>;
}
