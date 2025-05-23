### koenrane.xyz

This is my personal research and writing website, created from a fork of [Quartz](https://github.com/jackyzha0/quartz), which is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought)

Documentation https://quartz.jzhao.xyz/

### Structure

koenrane.xyz/

- ├── content/         # Main content directory
- ├── docs/            # Documentation
- ├── public/          # Static assets
- ├── quartz/          # Core Quartz framework
- ├── quartz.config.ts # Main configuration
- ├── quartz.layout.ts # Layout configuration
- └── package.json     # Dependencies and scripts

### Core Stack
- Framework: Quartz v4 (a specialized static site generator)
- Language: TypeScript
- Build System: Uses esbuild for bundling
- UI Framework: Preact (a lightweight React alternative)
- Styling: Custom CSS with theme support

### Plugins
- Content Processing:
  - FrontMatter
  - SyntaxHighlighting
  - ObsidianFlavoredMarkdown
  - GitHubFlavoredMarkdown
  - LaTeX rendering
- Page Generation:
  - ContentPage
  - FolderPage
  - TagPage
  - ContentIndex (with sitemap and RSS)
- Assets:
  - Static file handling
  - Favicon generation
  - Custom OG images

### Dependencies
- **preact** for UI components
- **remark** and **rehype** for markdown processing
- **flexsearch** for search functionality
- **d3** for data visualization
- **sharp** for image processing
- **satori** for image generation

