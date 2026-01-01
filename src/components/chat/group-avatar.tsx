import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const GroupAvatar = ({
  url,
  members = [],
  fallback,
}: {
  url?: string;
  members?: string[];
  fallback: string;
}) => {
  if (url) {
    return (
      <Avatar className="h-12 w-12 border border-border/40 shadow-sm">
        <AvatarImage src={url} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
          {fallback}
        </AvatarFallback>
      </Avatar>
    );
  }

  if (members.length >= 2) {
    return (
      <div className="relative h-12 w-12">
        <Avatar className="absolute top-0 right-0 h-8 w-8 border-2 border-background z-10">
          <AvatarImage src={members[0]} className="object-cover" />
          <AvatarFallback className="text-[8px] bg-blue-100 text-blue-600">
            M1
          </AvatarFallback>
        </Avatar>

        <Avatar className="absolute bottom-0 left-0 h-8 w-8 border-2 border-background">
          <AvatarImage src={members[1]} className="object-cover" />
          <AvatarFallback className="text-[8px] bg-green-100 text-green-600">
            M2
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <Avatar className="h-12 w-12 border border-border/40">
      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};
