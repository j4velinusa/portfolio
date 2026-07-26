import { notFound } from "next/navigation";
import { projects, getProject } from "@/content/projects";
import { ProjectView } from "./view";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.tagline.en} · Doğan Aykaç`,
    description: p.blurb.en,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  return <ProjectView project={project} nextSlug={next.slug} nextName={next.name} nextAccent={next.accent} />;
}
