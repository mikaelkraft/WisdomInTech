require("dotenv").config();
const { query } = require("../backend/_lib/db.js");

async function seed() {
  const { rows: users } = await query(
    "SELECT id FROM wisdomintech.user_profiles WHERE username = 'mike' LIMIT 1"
  );
  if (!users.length) {
    console.error("User 'mike' not found.");
    process.exit(1);
  }
  const authorId = users[0].id;

  const sampleProjects = [
    {
      title: "Antigravity Autonomous Agent Mesh",
      description: "Distributed AI agent workforce coordinating multi-repository code refactoring, automated review pipelines, and headless project syndication.",
      category: "AI & Autonomous Systems",
      tags: ["AI Agents", "Node.js", "PostgreSQL", "Webhooks", "TypeScript"],
      featured: true,
      featured_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      status: "published",
      repo_url: "https://github.com/wisdomintech/agent-mesh",
      repo_full_name: "wisdomintech/agent-mesh",
      branch: "main",
    },
    {
      title: "CyberKraft Headless Engine",
      description: "Next-generation headless content and project delivery network with sub-millisecond edge caching and developer API key access controls.",
      category: "Full Stack Infrastructure",
      tags: ["React", "Express", "REST API", "Cyberpunk UI", "TailwindCSS"],
      featured: true,
      featured_image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
      status: "published",
      repo_url: "https://github.com/wisdomintech/headless-engine",
      repo_full_name: "wisdomintech/headless-engine",
      branch: "main",
    },
    {
      title: "Neon Lakebase Realtime Sync",
      description: "Dual PostgreSQL synchronization architecture linking Supabase identity federation with Neon serverless data branches.",
      category: "Cloud Data Architecture",
      tags: ["Neon", "Supabase", "PostgreSQL", "Security", "OAuth"],
      featured: false,
      featured_image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      status: "published",
      repo_url: "https://github.com/wisdomintech/neon-sync",
      repo_full_name: "wisdomintech/neon-sync",
      branch: "main",
    },
  ];

  for (const p of sampleProjects) {
    const { rows: existing } = await query(
      "SELECT id FROM wisdomintech.projects WHERE title = $1 AND author_id = $2",
      [p.title, authorId]
    );
    if (!existing.length) {
      const { rows: inserted } = await query(
        `INSERT INTO wisdomintech.projects (
           title, description, category, tags, featured, featured_image, status, author_id, view_count, like_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 142, 28)
         RETURNING id`,
        [p.title, p.description, p.category, p.tags, p.featured, p.featured_image, p.status, authorId]
      );
      const projId = inserted[0].id;

      // Link repo
      await query(
        `INSERT INTO wisdomintech.project_repositories (
           project_id, provider, repo_url, repo_full_name, default_branch, sync_metadata
         ) VALUES ($1, 'github', $2, $3, $4, $5::jsonb)
         ON CONFLICT (project_id, repo_url) DO NOTHING`,
        [
          projId,
          p.repo_url,
          p.repo_full_name,
          p.branch,
          JSON.stringify({ stars: 84, forks: 19, openIssues: 2, defaultBranch: "main" }),
        ]
      );

      // Add owner role in project_members
      await query(
        `INSERT INTO wisdomintech.project_members (project_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projId, authorId]
      );

      console.log(`Seeded project: ${p.title} (${projId})`);
    } else {
      console.log(`Project already exists: ${p.title}`);
    }
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
