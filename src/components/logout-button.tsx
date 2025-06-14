"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth.actions";

export function LogoutButton() {
  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}
