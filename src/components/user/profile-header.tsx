// components/user/profile-header.tsx
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusEnum } from "@/common/enum";
import { cn } from "@/lib/utils";
import type { IUserProfile } from "@/types/profile";

interface ProfileHeaderProps {
  profile: IUserProfile;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="relative w-full group">
      {/* Cover Image Area */}
      <div className="h-60 md:h-72 w-full overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />
        <Image
          src={DEFAULT_COVER}
          alt="Cover"
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="px-6 md:px-12 -mt-20 relative z-20 flex flex-col md:flex-row items-center md:items-end gap-6">
        <div className="relative shrink-0">
          <div className="p-1.5 rounded-full bg-background/30 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-inner">
              <AvatarImage
                src={profile.avatar || undefined}
                alt={profile.name}
                className="object-cover"
              />
              <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                {profile.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left mb-4 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground drop-shadow-lg tracking-tight">
            {profile.name}
          </h1>
        </div>
      </div>
    </div>
  );
};
