import { Skeleton } from "@/components/toolkit";

export const ProfileSkeleton = () => {
  return (
    <div className="h-full w-full max-w-6xl mx-auto px-0 sm:px-4 md:px-6 pb-16 overflow-hidden">
      <div className="relative w-full mb-8">
        <Skeleton className="h-48 sm:h-64 md:h-76 w-full rounded-none sm:rounded-b-3xl" />
        <div className="px-4 sm:px-6 md:px-10 -mt-14 sm:-mt-20 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-5 pb-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 w-full md:w-auto">
            <Skeleton className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-background shrink-0" />
            <div className="space-y-2.5 flex-1 text-center md:text-left pb-1">
              <Skeleton className="h-8 w-52 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-72 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-44 mx-auto md:mx-0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};
