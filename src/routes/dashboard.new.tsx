import { createFileRoute } from "@tanstack/react-router";
import { ReleaseForm } from "@/components/release-form";

export const Route = createFileRoute("/dashboard/new")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ReleaseForm />
    </div>
  ),
});
