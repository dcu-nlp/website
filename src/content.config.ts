import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const linkSchema = z.object({
  label: z.string(),
  href: z.string().url(),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      affiliation: z.string(),
      bio: z.string(),
      image: image().optional(),
      photo: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      scholar: z.string().url().optional(),
      github: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      dblpId: z.string().optional(),
      orcidId: z.string().optional(),
      publicationNameVariants: z.array(z.string()).default([]),
      publicationsEnabled: z.boolean().default(false),
      researchAreas: z.array(z.string()),
      order: z.number().default(99),
      status: z
        .enum(['faculty', 'postdoc', 'phd', 'masters', 'alumni', 'staff'])
        .default('phd'),
      featured: z.boolean().default(false),
    }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/publications' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.number(),
      authors: z.array(z.string()),
      venue: z.string(),
      abstract: z.string(),
      tags: z.array(z.string()),
      featured: z.boolean().default(false),
      paperUrl: z.string().url().optional(),
      codeUrl: z.string().url().optional(),
      bibtex: z.string().optional(),
      award: z.string().optional(),
      image: image().optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      status: z.enum(['active', 'prototype', 'completed']),
      people: z.array(z.string()),
      tags: z.array(z.string()),
      links: z.array(linkSchema).default([]),
      featured: z.boolean().default(false),
      image: image().optional(),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      category: z.enum(['publication', 'award', 'event', 'group', 'teaching']),
      featured: z.boolean().default(false),
      links: z.array(linkSchema).default([]),
      image: image().optional(),
    }),
});

const teaching = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/teaching' }),
  schema: z.object({
    title: z.string(),
    term: z.string(),
    role: z.string(),
    summary: z.string(),
    links: z.array(linkSchema).default([]),
    materials: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { people, publications, projects, news, teaching };
