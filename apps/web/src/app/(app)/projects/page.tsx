import { Plus } from "lucide-react";
import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectsTable } from "@/components/projects/projects-table";
import { projectsApi } from "@/lib/api";

export default async function ProjectsPage() {
  const res = await projectsApi.fetchProjects();
  if (!res.success) throw new Error(res.error.message);

  return (
    <>
      <SetHeader
        title="Projects"
        action={{ label: "New Project", icon: <Plus className="size-3.5" />, modal: "create-project" }}
      />
      <Card>
        <CardContent>
          <ProjectsTable projects={res.data} />
        </CardContent>
      </Card>
    </>
  );
}
