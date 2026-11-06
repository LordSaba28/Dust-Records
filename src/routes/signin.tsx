import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({ component: SignInRedirect });

function SignInRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/access", replace: true });
  }, [navigate]);
  return null;
}
