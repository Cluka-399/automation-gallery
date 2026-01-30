#!/usr/bin/env node
/**
 * Automation Gallery Aggregator
 * Fetches skills from multiple sources and generates SKILL.md + JSON
 */

import fs from 'fs/promises';
import path from 'path';

const SOURCES = {
  awesomeMoltbot: 'https://raw.githubusercontent.com/VoltAgent/awesome-moltbot-skills/main/README.md',
  clawdhub: 'https://clawdhub.com/api/skills'
};

async function fetchAwesomeMoltbot() {
  console.log('Fetching awesome-moltbot-skills...');
  try {
    const res = await fetch(SOURCES.awesomeMoltbot);
    const md = await res.text();
    
    // Parse skills from markdown
    const skills = [];
    const lines = md.split('\n');
    let currentCategory = 'Uncategorized';
    
    for (const line of lines) {
      // Category headers in <summary><h3>Category Name</h3></summary> format
      const catMatch = line.match(/<summary><h3[^>]*>([^<]+)<\/h3><\/summary>/);
      if (catMatch) {
        currentCategory = catMatch[1].trim();
        continue;
      }
      
      // Also try plain ### headers
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match && !line.includes('<')) {
        currentCategory = h3Match[1].replace(/#.+$/, '').trim();
        continue;
      }
      
      // Skill entries: - [name](url) - description
      const skillMatch = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)\s*[-–—]?\s*(.*)$/);
      if (skillMatch) {
        const name = skillMatch[1].trim();
        const url = skillMatch[2].trim();
        let description = skillMatch[3].trim();
        
        // Skip table of contents entries (they link to anchors)
        if (url.startsWith('#')) continue;
        
        skills.push({
          name,
          url,
          description,
          category: currentCategory,
          source: 'awesome-moltbot-skills'
        });
      }
    }
    
    console.log(`  Found ${skills.length} skills`);
    return skills;
  } catch (err) {
    console.error('  Error fetching awesome-moltbot-skills:', err.message);
    return [];
  }
}

async function fetchClawdHub() {
  console.log('Fetching ClawdHub...');
  try {
    const res = await fetch(SOURCES.clawdhub);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const skills = (data.skills || data || []).map(s => ({
      name: s.name || s.slug,
      url: s.url || `https://clawdhub.com/skills/${s.slug}`,
      description: s.description || '',
      category: s.category || 'Uncategorized',
      source: 'clawdhub',
      downloads: s.downloads,
      author: s.author
    }));
    
    console.log(`  Found ${skills.length} skills`);
    return skills;
  } catch (err) {
    console.error('  Error fetching ClawdHub:', err.message);
    return [];
  }
}

function dedupeSkills(skills) {
  const seen = new Map();
  for (const skill of skills) {
    const key = skill.name.toLowerCase();
    if (!seen.has(key) || skill.source === 'clawdhub') {
      seen.set(key, skill);
    }
  }
  return Array.from(seen.values());
}

function generateSkillMd(skills) {
  const byCategory = {};
  for (const skill of skills) {
    const cat = skill.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(skill);
  }
  
  let md = `---
name: automation-gallery
description: Discover 700+ automations and skills for Moltbot/OpenClaw. Searchable index of what you can build with your AI assistant.
---

# Automation Gallery

**${skills.length} automations** from the Moltbot/OpenClaw ecosystem.

Use this to discover what's possible with your AI assistant. Search by keyword or browse by category.

*Auto-updated daily from awesome-moltbot-skills + ClawdHub*

---

## How to Use

Ask your assistant:
- "What automations are available for productivity?"
- "Find skills for smart home control"
- "Show me finance-related automations"

---

## Categories

`;

  const sortedCats = Object.keys(byCategory).sort();
  for (const cat of sortedCats) {
    const anchor = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    md += `- [${cat}](#${anchor}) (${byCategory[cat].length})\n`;
  }
  
  md += '\n---\n\n';
  
  for (const cat of sortedCats) {
    md += `## ${cat}\n\n`;
    for (const skill of byCategory[cat].sort((a, b) => a.name.localeCompare(b.name))) {
      md += `- **${skill.name}**`;
      if (skill.description) md += ` — ${skill.description}`;
      if (skill.url) md += ` [→](${skill.url})`;
      md += '\n';
    }
    md += '\n';
  }
  
  md += `---\n\n*Generated: ${new Date().toISOString()}*\n`;
  
  return md;
}

async function main() {
  console.log('🔄 Automation Gallery Aggregator\n');
  
  const [awesomeSkills, clawdhubSkills] = await Promise.all([
    fetchAwesomeMoltbot(),
    fetchClawdHub()
  ]);
  
  const allSkills = [...awesomeSkills, ...clawdhubSkills];
  const dedupedSkills = dedupeSkills(allSkills);
  
  console.log(`\n📊 Total: ${dedupedSkills.length} unique skills\n`);
  
  // Log category breakdown
  const catCounts = {};
  for (const s of dedupedSkills) {
    catCounts[s.category] = (catCounts[s.category] || 0) + 1;
  }
  const topCats = Object.entries(catCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  console.log('Top categories:', topCats.map(([c,n]) => `${c}(${n})`).join(', '));
  
  // Generate outputs
  const skillMd = generateSkillMd(dedupedSkills);
  const jsonData = {
    generated: new Date().toISOString(),
    count: dedupedSkills.length,
    skills: dedupedSkills
  };
  
  // Write files
  const outDir = path.resolve(process.cwd());
  await fs.writeFile(path.join(outDir, 'SKILL.md'), skillMd);
  await fs.writeFile(path.join(outDir, 'automations.json'), JSON.stringify(jsonData, null, 2));
  
  console.log('\n✅ Generated SKILL.md and automations.json');
}

main().catch(console.error);
