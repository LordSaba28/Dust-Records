import { createFileRoute } from "@tanstack/react-router";
import { ReleaseForm } from "@/components/release-form";

export const Route = createFileRoute("/dashboard/$id")({
  component: EditRelease,
});

function EditRelease() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ReleaseForm releaseId={id} />
    </div>
  );
}
