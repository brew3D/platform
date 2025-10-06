"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function Project2DPageLower() {
  const params = useParams();
  const id = params?.id;
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#e5e7eb' }}>2D Page here</h1>
      <p style={{ color: '#9ca3af' }}>Project ID: {id}</p>
    </div>
  );
}

import { redirect } from "next/navigation";

export default function RedirectProjects2D({ params }) {
  const id = params?.id;
  redirect(`/dashboard/projects2d/${id}`);
}


