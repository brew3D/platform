import { redirect } from "next/navigation";

export default function RedirectProjects2D({ params }) {
  const id = params?.id;
  redirect(`/dashboard/projects2d/${id}`);
}


