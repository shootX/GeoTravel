import { Router } from "express";
import { prisma } from "../lib/db";

const router = Router();

router.get("/destinations", async (req, res) => {
  try {
    const destinations = await prisma.featuredDestination.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ destinations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
});

router.get("/destinations/:id", async (req, res) => {
  try {
    const destination = await prisma.featuredDestination.findUnique({
      where: { id: req.params.id },
    });
    if (!destination || !destination.isPublished) {
      return res.status(404).json({ error: "Destination not found" });
    }
    res.json({ destination });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch destination" });
  }
});

router.post("/newsletter", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  res.json({ ok: true });
});

router.get("/blog", async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
    });
    if (!post || !post.isPublished) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

router.get("/packages", async (req, res) => {
  try {
    const packages = await prisma.travelPackage.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: { country: true },
    });
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

router.get("/routes", async (req, res) => {
  try {
    const routes = await prisma.routeTemplate.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

export default router;
