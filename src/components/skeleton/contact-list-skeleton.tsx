import { Skeleton } from "@/components/ui/skeleton";

export const ContactListSkeleton = () => {
  const dummyGroups = Array.from({ length: 2 }, (_, i) => i);

  const dummyItems = Array.from({ length: 2 }, (_, i) => i);

  return (
    <div className="space-y-8 px-2">
      {dummyGroups.map((groupIndex) => (
        <div key={`group-${groupIndex}`} className="space-y-4">
          <div className="flex items-center">
            <Skeleton className="h-8 w-12 rounded-full bg-primary/10" />
          </div>

          <div className="flex flex-col gap-2">
            {dummyItems.map((itemIndex) => (
              <div
                key={`item-${groupIndex}-${itemIndex}`}
                className="flex items-center gap-4 p-2 rounded-xl"
              >
                <Skeleton className="h-12 w-12 shrink-0 rounded-full border-2 border-background/50" />

                <div className="flex-1 space-y-2 py-1">
                  <Skeleton
                    className="h-4 rounded-md"
                    style={{
                      width: `${Math.floor(Math.random() * (60 - 30 + 1) + 30)}%`,
                    }}
                  />
                  <Skeleton className="h-3 w-1/2 rounded-md opacity-60" />
                </div>

                <Skeleton className="h-8 w-8 rounded-full opacity-30" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
