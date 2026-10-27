import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Approve / reject pair with an optional note, wired to a bound server action. */
export function ReviewButtons({ action, withNote = true }: { action: (approve: boolean, form: FormData) => Promise<void>; withNote?: boolean }) {
  return (
    <form className="flex flex-wrap items-center gap-2">
      {withNote && <Input name="note" placeholder="Түсініктеме (міндетті емес)" className="h-8 w-56" />}
      <Button size="sm" variant="success" formAction={action.bind(null, true)}>
        Растау
      </Button>
      <Button size="sm" variant="destructive" formAction={action.bind(null, false)}>
        Қабылдамау
      </Button>
    </form>
  );
}
