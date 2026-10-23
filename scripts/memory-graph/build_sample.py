"""Sample and scrub the ai-memory graph export for the public 3D prototype.

Keeps the real topology; strips every label except a curated list of project
names and an allowlist of tool names. Lays the graph out in 3D offline so the
browser only renders.

Rebuild public/memory/index.html (the live /memory/ page):
    pt graph export > graph.json
    uv run --with networkx --with numpy --with scipy python build_sample.py graph.json sample.json
then put sample.json in place of the one __GRAPH__ in memory-graph.template.html.
"""
import json
import random
import sys
from collections import defaultdict

import networkx as nx
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
random.seed(7)

PROJECTS = """ai-memory project-tracker holoscape hypocrisynow muffinpanrecipes picasa2 flo-fi
analyze-youtube-videos asbuilt ledgercheck duplicate-image-highlighter clipstash pickkit
dead-written-languages timeline adventure-cat-photos state-business-tax-skills writing-companion
trading-copilot tax-organizer eriksjaastad sailboat cortana-personal-ai book-library""".split()

TOOLS = {k.lower(): k for k in """Python Doppler GitHub MCP Vercel Anthropic Claude Codex Slack SQLite
Railway Cloudflare Turso OpenAI Postgres Gemini Stripe OAuth React JavaScript Rust Flask TypeScript
ONNX Docker Ollama Tailwind FastAPI Bun Terraform AWS Redis Notion Supabase Figma PyTorch Qwen Opus
Sonnet Haiku GPT""".split()}
TOOLS["next.js"] = "Next.js"
TOOLS["huggingface"] = "Hugging Face"
TOOLS["postgresql"] = "Postgres"

FILLER_TYPES = ["artifact", "task", "decision", "lesson", "person"]
TARGET = 2600
PER_PROJECT = 70

g = json.load(open(SRC))
nodes = {n["id"]: n for n in g["nodes"]}
adj = defaultdict(dict)
for e in g["edges"]:
    a, b, w = e["source"], e["target"], e.get("weight", 1.0)
    if a in nodes and b in nodes and a != b:
        adj[a][b] = max(adj[a].get(b, 0), w)
        adj[b][a] = max(adj[b].get(a, 0), w)

proj_ids = {}
for n in g["nodes"]:
    if n["type"] == "project" and n["name"] in PROJECTS:
        if n["name"] not in proj_ids or n["size"] > nodes[proj_ids[n["name"]]]["size"]:
            proj_ids[n["name"]] = n["id"]

tool_ids = {}
for n in g["nodes"]:
    if n["type"] == "concept" and n["name"].lower() in TOOLS:
        disp = TOOLS[n["name"].lower()]
        if disp not in tool_ids or n["size"] > nodes[tool_ids[disp]]["size"]:
            tool_ids[disp] = n["id"]

label = {i: ("project", p) for p, i in proj_ids.items()}
label.update({i: ("concept", t) for t, i in tool_ids.items()})
chosen = set(label)


def filler_ok(i):
    return nodes[i]["type"] in FILLER_TYPES


for p, pid in proj_ids.items():
    nbrs = sorted((j for j in adj[pid] if filler_ok(j)), key=lambda j: -adj[pid][j])
    chosen.update(nbrs[:PER_PROJECT])

frontier = [i for i in chosen if i not in label]
person_cap = TARGET // 5
persons = sum(1 for i in chosen if nodes[i]["type"] == "person")
while len(chosen) < TARGET and frontier:
    i = random.choice(frontier)
    cands = [j for j in adj[i] if filler_ok(j) and j not in chosen
             and (nodes[j]["type"] != "person" or persons < person_cap)]
    if not cands:
        frontier.remove(i)
        continue
    j = random.choice(cands)
    persons += nodes[j]["type"] == "person"
    chosen.add(j)
    frontier.append(j)

# Edges: everything touching a labeled node, plus each filler node's 3 strongest.
edges = set()
for i in chosen:
    nb = [j for j in adj[i] if j in chosen]
    if i in label:
        cap = 120 if label[i][0] == "project" else 30
        keep = sorted(nb, key=lambda j: -adj[i][j])[:cap]
    else:
        keep = sorted(nb, key=lambda j: -adj[i][j])[:3]
    for j in keep:
        if j in label and nodes[j]["type"] == "concept" and i not in label:
            # tools link to nearly everything; keep only strong links so they don't collapse the layout
            if adj[i][j] < 3:
                continue
        edges.add((min(i, j), max(i, j)))

G = nx.Graph()
G.add_nodes_from(chosen)
for a, b in edges:
    G.add_edge(a, b, weight=min(adj[a][b], 10.0))
# drop isolated filler
for i in list(G.nodes):
    if G.degree(i) == 0 and i not in label:
        G.remove_node(i)

# Pin project hubs on a Fibonacci sphere so each reads as its own cluster; everything else relaxes around them.
R = 260
init = {}
names = sorted(proj_ids)
for k, name in enumerate(names):
    y = 1 - 2 * (k + 0.5) / len(names)
    r = np.sqrt(1 - y * y)
    th = k * np.pi * (3 - np.sqrt(5))
    init[proj_ids[name]] = np.array([np.cos(th) * r, y, np.sin(th) * r]) * R
rng = np.random.default_rng(7)
for i in G.nodes:
    if i not in init:
        hubs = [init[j] for j in G.neighbors(i) if j in init]
        base = np.mean(hubs, axis=0) * 0.8 if hubs else np.zeros(3)
        init[i] = base + rng.normal(0, 40, 3)
pos = nx.spring_layout(G, dim=3, pos=init, fixed=list(proj_ids.values()), k=18, iterations=150,
                       weight="weight", seed=7)
# Pull stragglers in so the cloud has a soft edge instead of long whiskers.
for i, v in pos.items():
    d = np.linalg.norm(v)
    if d > R * 1.35:
        pos[i] = v / d * (R * 1.35 + np.log1p(d - R * 1.35) * 8)

order = sorted(G.nodes, key=lambda i: (i not in label, nodes[i]["type"], i))
index = {i: k for k, i in enumerate(order)}
TYPES = ["project", "concept"] + FILLER_TYPES
out_nodes = []
for i in order:
    x, y, z = (round(float(v), 1) for v in pos[i])
    t = nodes[i]["type"]
    rec = [x, y, z, TYPES.index(t), int(G.degree(i))]
    if i in label:
        rec.append(label[i][1])
    out_nodes.append(rec)
out_edges = []
for a, b in G.edges:
    out_edges += [index[a], index[b]]

full_counts = defaultdict(int)
for n in g["nodes"]:
    full_counts[n["type"]] += 1

data = {
    "types": TYPES,
    "nodes": out_nodes,
    "edges": out_edges,
    "full": {"nodes": len(g["nodes"]), "edges": len(g["edges"]), "byType": dict(full_counts)},
}

# Leak check: the only strings in the output are type names and allowlisted labels.
allowed = set(TYPES) | set(PROJECTS) | set(TOOLS.values()) | set(full_counts) | {
    "types", "nodes", "edges", "full", "byType"}
blob = json.dumps(data)
strings = set()
for rec in out_nodes:
    strings.update(s for s in rec if isinstance(s, str))
assert strings <= allowed, strings - allowed
json.dump(data, open(OUT, "w"), separators=(",", ":"))
print(f"nodes={len(out_nodes)} edges={len(out_edges)//2} bytes={len(blob)} "
      f"projects={len(proj_ids)} tools={len(tool_ids)}")
