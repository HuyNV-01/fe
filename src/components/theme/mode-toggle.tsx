"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Switch } from "../ui/switch";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Switch checked={false} disabled isTheme={true} />;
  }

  const isDark = theme === "dark";

  return (
    <Switch
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      isTheme={true}
    />
  );
}
