import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { SetHeader } from "@/components/shell/set-header";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { projectsApi } from "@/lib/api";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const res = await projectsApi.fetchProject(projectId);
  if (!res.success) notFound();
  const project = res.data;

  return (
    <>
      <SetHeader
        title={project.name}
        backHref="/projects"
        backLabel="All Projects"
        action={{
          label: "Run Audit",
          icon: <Play className="size-3.5" />,
          href: `/audit-center?projectId=${project.id}`,
        }}
      />
      <ProjectTabs projectId={project.id} />
      {children}
    </>
  );
}
