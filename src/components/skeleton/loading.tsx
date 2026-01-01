import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
export type LoadingProps = { loading?: boolean; className?: string };

export default function Loading({ loading = false, className }: LoadingProps) {
  return (
    <>
      {loading && (
        <div className="w-screen h-screen fixed z-[999] inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-accent-foreground/50 opacity-60"></div>
          <span className={cn("w-12 h-12 text-sky-600 z-[1000]", className)}>
            <Spinner className="size-12" />
          </span>
        </div>
      )}
    </>
  );
}
