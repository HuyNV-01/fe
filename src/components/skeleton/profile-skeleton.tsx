import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="h-full w-full p-4 md:p-6 overflow-hidden">
      <div className="relative w-full mb-20">
        <Skeleton className="h-60 md:h-72 w-full rounded-3xl" />
        <div className="px-6 md:px-12 -mt-16 relative flex flex-col md:flex-row items-center md:items-end gap-6">
          <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background" />
          <div className="space-y-3 flex-1 text-center md:text-left mb-4">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
