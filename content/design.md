---
title: DESIGN OF THIS WEBSITE
permalink: design
publish: true
tags:
  - website
  - typescript
  - CSS
  - typograhpy
  - design
  - meta
hideSubscriptionLinks: false
card_image:
date_published: 2025-03-18
status: in-progress 
no_dropcap: "false"

---
Koenrane.xyz is implemented as a static website using a custom forked quartz repository and is hosted on a droplet VM.

This site has taken many ideas and suggestions on design and typography from a select few sources. One of those, which will be very obvious to readers will be the website of [Gwern](https://gwern.net). I spent several years reading this site and gathering knowledge for proper ways to build a site that is pleasing to the eyes while providing content that is interesting and strives to adhere to an [iceberg build](https://gwern.net/style-guide#success-metrics-for-the-iceberg-build-process) process, which is one of my highest aims for this site. 

Major features include link popups, footnotes, dropcaps, smallcaps, multiple admonition types, inline favicons, which are all presented in a monochrome aesthetic, where the ultimate aim is to present content that can be long-form, long-lasting, and linkable, while being visually appealing to readers.  


# PRINCIPLES
---
There are many high-level design principles that the concrete features on this site embody. These features collectively support several fundamental design philosophies from UX, visual design, and software engineering:

1. Clarity over cleverness
   - [Information Architecture](https://medium.com/@mattholla/the-eight-principles-of-information-architecture-6feff11f907a), [Minimalist Aesthetic](https://carlbarenbrug.com/minimal-design), [Cognitive Load Theory](https://www.nngroup.com/articles/minimize-cognitive-load/)
2. Performance as a feature
   - [Progressive Enhancement](https://blog.hubspot.com/website/what-is-progressive-enhancement), [Perceived Performance](https://www.sitepoint.com/a-designers-guide-to-fast-websites-and-perceived-performance/), [User-First Optimization](https://medium.com/@MobileAppDesigner/user-first-design-principles-mastering-ui-ux-for-success-6d52f4e8b5e5)
3. Consistency breeds trust
   - [Design Systems Thinking](https://medium.com/design-voices/system-thinking-for-designers-e9f025698a32), [Visual Rhythm](https://www.interaction-design.org/literature/article/repetition-pattern-and-rhythm?srsltid=AfmBOoo9Mo6FssSssw9hlR6LEh_9ZXf_5oZDKjDwIp39tMWzBJTV2eMT), [Jakob’s Law](https://lawsofux.com/jakobs-law/?utm_source=chatgpt.com) (users expect consistency)
4. Respect reader agency
   - User Control and Freedom, [Progressive Disclosure](https://en.wikipedia.org/wiki/Progressive_disclosure)
5. Usabilit, not at the expense of character
   - [Emotional Design](https://www.interaction-design.org/literature/topics/emotional-design), [Delight without Distraction](https://voltagecontrol.com/blog/radical-acts-of-delight/)
6. Accessibility through semantics
   - [Semantic Web Principles](https://www.w3.org/DesignIssues/Semantic.html?utm_source=chatgpt.com), [Accessible Design](https://www.w3.org/WAI/tips/designing/)
7. Robustness via automation
   - [Defensive Design](https://en.wikipedia.org/wiki/Defensive_design), [Reliability Engineering](https://www.squadcast.com/blog/sre-principles#basic-sre-principles-)

</br>

## INTERCONNECTION

For as long as I can remember, I have been irked by inconsistent styling and design, mostly in the digital space, where my design work has primarily resided. Those days are long gone, left behind because the design culture at the time was steering toward a theme that was, for lack of a better term, abhorrent. This was around the 2009-2010 timeframe, and I had just finished the design portion of my undergraduate curriculum, which allowed me to dip my toe into that world for the next 4 years. As I worked through those years designing ads and eventually became a designer at a large religious institution, I found myself asking, "What purpose does this work serve?". This was generated from a realization that my work had consistently been shallow, [kitschy](https://en.wikipedia.org/wiki/Kitsch), and devoid of any attributes of longevity. The last part was the most difficult aspect to contend with, and I found myself caring less and less about the work as it became rather meaningless. Around this timeframe, unfortunately, I was walking around with an unhelpful amount of naivete and wasn't aware of the many interesting projects around reader-centric, long-lasting and connected design, even though I was a product of being [extremely online](https://en.wikipedia.org/wiki/Extremely_online). There have been many phases of my life, and I consider this one my artist phase, where I sacrificed a lot of knowledge-seeking for experience-seeking. There is no fault in this way of living, and it served me well, but I did not find what I was looking for. As an avid reader for most of my life, the internet opened up my mind to the expansive universe of knowledge and information which allowed it to be more available for creating novel connections. 

The internet has largely connected many people, projects, and professions, and as the years progressed, we became more mature and thoughtful in our design. There is one project that has sat in its own space, and even though it was not able to fully mature, it was a worthwhile attempt at changing the paradigm of content presentation. That was Project Xanadu. My interest in this project mainly originated from the attitude that the content was most important and that context mattered. The design *served* the content, was radically reader-first, and was an inverse of the attention economy. 

>[!quote]...interconnection and expressing that interconnection has been the center of all of my thinking and all my computer work has been about expressing and representing and showing interconnection among writings especially, and writing is the process of reducing a tapestry of interconnection to a narrow sequence and this is in a sense illicit. This is a wrongful compression of what should spread out in today's computers.
> 
> [Ted Nelson](http://www.thetednelson.com/), in Herzog's *Lo and Behold*

> [!info] [an honorable and novel attempt that reverberates to the present, Project Xanadu:](https://en.wikipedia.org/wiki/Project_Xanadu)

</br>

# SITE TESTING
>[!info][*Test Page*](/Test%20page)