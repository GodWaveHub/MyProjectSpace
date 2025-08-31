import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

const DOCS_DIR = process.env.DOCS_DIR || '/workdir/docs/javadoc';
const SAMPLES_DIR = process.env.SAMPLES_DIR || '/workdir/docs/samples';

const server = new Server(
  { name: 'GeoMationApiSample', version: '0.1.0' },
  { capabilities: { tools: {}, resources: {} } }
);

async function dirExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function globSafe(pattern, cwd) {
  try {
    return await fg(pattern, { cwd, dot: false });
  } catch {
    return [];
  }
}

// resources/list
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = [];

  if (await dirExists(DOCS_DIR)) {
    const htmlFiles = await globSafe('**/*.html', DOCS_DIR);
    for (const rel of htmlFiles) {
      const uri = `mcp://apidocs/javadoc/${rel.replace(/\\/g, '/')}`;
      resources.push({
        uri,
        name: `Javadoc: ${rel}`,
        description: 'GeoMationのJavadoc HTML',
        mimeType: 'text/html'
      });
    }
  }

  if (await dirExists(SAMPLES_DIR)) {
    const sampleFiles = await globSafe('**/*.*', SAMPLES_DIR);
    for (const rel of sampleFiles) {
      const ext = path.extname(rel).slice(1) || 'plain';
      const uri = `mcp://apidocs/samples/${rel.replace(/\\/g, '/')}`;
      resources.push({
        uri,
        name: `Sample: ${rel}`,
        description: 'GeoMationのSample code/resource',
        mimeType: `text/${ext === 'java' ? 'x-java-source' : 'plain'}`
      });
    }
  }

  return { resources };
});

// resources/read
server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const { uri } = req.params;
  if (!/^mcp:\/\/apidocs\/(javadoc|samples)\//.test(uri)) {
    throw new Error('Unsupported URI');
  }

  const m = uri.match(/^mcp:\/\/[^/]+\/(javadoc|samples)\/(.+)$/);
  if (!m) throw new Error('Invalid MCP URI format');

  const domain = m[1];
  const relPath = m[2];
  const baseDir = domain === 'javadoc' ? DOCS_DIR : SAMPLES_DIR;
  const absPath = path.join(baseDir, relPath);

  const data = await fs.readFile(absPath, 'utf8');
  const mimeType =
    domain === 'javadoc'
      ? 'text/html'
      : path.extname(absPath) === '.java'
        ? 'text/x-java-source'
        : 'text/plain';

  return { contents: [{ uri, mimeType, text: data }] };
});

// tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_javadoc',
        description: 'キーワードでGeoMationのJavadoc内のファイルパスを検索',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        }
      },
      {
        name: 'search_samples',
        description: 'キーワードでGeoMationのサンプルコード内のファイルパスを検索',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        }
      }
    ]
  };
});

async function simpleSearch(cwd, query) {
  if (!cwd || !(await dirExists(cwd))) return [];
  const files = await globSafe('**/*.*', cwd);
  const q = (query || '').toLowerCase();
  const results = [];
  for (const rel of files) {
    const p = path.join(cwd, rel);
    try {
      const text = await fs.readFile(p, 'utf8');
      if (rel.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
        results.push({ path: rel, score: rel.toLowerCase().includes(q) ? 2 : 1 });
      }
    } catch {
      // ignore unreadable file
    }
    if (results.length >= 50) break;
  }
  results.sort((a, b) => b.score - a.score);
  return results.map(r => r.path);
}

// tools/call
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === 'search_javadoc') {
    const hits = await simpleSearch(DOCS_DIR, args?.query || '');
    return { content: [{ type: 'text', text: hits.map(h => `mcp://apidocs/javadoc/${h}`).join('\n') }] };
  }
  if (name === 'search_samples') {
    const hits = await simpleSearch(SAMPLES_DIR, args?.query || '');
    return { content: [{ type: 'text', text: hits.map(h => `mcp://apidocs/samples/${h}`).join('\n') }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
server.connect(transport);