---
permalink: changelog
title: CHANGELOG
publish: true
date_published: 2025-02-05
status: in-progress
tags:
  - site
  - meta
---

</br>

Monthly chronological list of writings, changes, and additions. Code changes can be tracked in the GitHub [repo](https://github.com/koenrane/koenrane.xyz)-

</br>


# 2025

----
## NEW SITE

---

### JULY

- added content to [Book Reviews](/book-reviews) - Silo Series
- added spacing elements in book review titles between link, author, and star rankings plus other small formatting errors. 
- new essay: [Four Years of Whoop](/4-years-of-whoop)
- new essay: [Essay Writing with LLMS Affects Cognition](/brain-on-chatgpt)
- pmwiki site was completely refactored into a quartz SSG. Previous host server on DigitalOcean was sunset, archived, and shut down. Code files for pmwiki on Github were archived and replaced with Quartz infrastructure and content files, then pulled to local. An instance on Cloudflare was setup, and the domain hosting was transferred there. The first production build was pushed from remote to Cloudflare server to initialize the project and the site was successfully loaded in the browser. An R2 instance was setup for asset hosting and all images were transferred to assets.koenrane.xyz.
- Numerous formatting and aesthetic adjustments were made to reflect the desired initial look of the site.

### JUNE

- [The Oneiroi's Subject](/the-oneirois-subject)
- [Tea Reviews](/tea-reviews)
- [Book Reviews](/book-reviews)
- replaced pmwiki remote repo with quartz site refactor files

## OLD SITE

----

### MAY

- [Containerized Intentionality](/containerized-intentionality)
- added page link to longform LessWrong post: A Guide to AI 2027
- added left-padding to skin.css to shorten the width of text

### APRIL

- reformatted page status identifiers to category links for better tracking.
- significant progress made on Whoop Analysis essay: added TOC and sections on strain, recovery, sleep, and code blocks for strain analysis
- archived all blog posts into 'z_archive' folder in GitHub
- added [[https://koenrane.xyz/?n=Main.TeaReviews | Tea Reviews]] page

### MARCH

- created changelog page
- created 'meta' landing page
- Added new Koen Rane site logo, altered config.php to map to new logo.
- KR logo max width CSS adjusted
- uploaded essay: [[https://koenrane.xyz/?n=Main.ContainerizedIntentionality | Containerized Intentionality]]
- started essay: [[https://koenrane.xyz/?n=Main.4YearsofWhoop | Analysis From ~ 4 Years of WHOOP]]
- updated ''About Site'' page with pdf archiving process
- created dropbox directory for site archiving
- added new page: [[https://koenrane.xyz/?n=Main.BookReviews | Book Reviews]]
- archived Bookantt Tracker for 2024
- updated Bookantt Tracker for 2025
- added new page: [[https://koenrane.xyz/?n=Main.Technical | Technical page]]
- added [[https://github.com/GeSHi/geshi-1.0 | geshi]] and sourceblock.php to cookbooks directory for code highlighting and formatting
- inserted right-padding to wiki-text in [[https://github.com/koenrane/koenrane.xyz/blob/main/pub/skins/pmwiki-responsive/skin.css | skin.css]] to make paragraphs more readable. On mobile, the paragraphs were too close to the edge of the screen, which made it difficult to read. On desktop, the right margin size is similar to the left giving the page more symmetry. 
- adjusted max import file size limit to 300KB
- reformatted About Me and About Site page section titles
- created Fiction section on the home page and added the first chapter of my longstanding fictional novel. ''"The Oneiroi's Subject"'' is a working title and will possibly change at the end. As of March 2025, there are 11 Chapters, all in different states of completion (is any writing ever completed?)

### FEBRUARY

- established the koenrane.xyz domain.
- created a [[https://www.digitalocean.com/products/droplets | Digital Ocean Droplet server]] to host the website
- setup Ubuntu 24.10 x64 OS. Also, setup nginx environment
- established koenrane.xyz [[https://github.com/koenrane/koenrane.xyz | repo]] in GitHub
- built pmwiki markdown syntax templates for more efficient text formatting: [[https://github.com/koenrane/koenrane.xyz/blob/main/pmwiki_syntax_template/syntax_template.txt | pmwiki_syntax_template.txt]]
-built pandoc lua filter to convert standard markdown to pmwiki markdown: [[https://github.com/koenrane/koenrane.xyz/blob/main/pandoc/markdown-to-pmwiki.lua | @@markdown-to-pmwiki.lua]]
- Created all current existing wiki pages (as of Feb 2025)