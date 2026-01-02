---
permalink: brain-on-chatgpt
publish: "true"
title: "ESSAY WRITING WITH LLMs AFFECTS COGNITION"
description: 
date_published: 2025-07-01
status: in-progress
tags:
  - AI
  - LLMs
  - education
  - cognition
---

How LLMs are used have been shown to affect cognitive load and brain network interaction which can inhibit learning outcomes. Researchers found that writing using LLMs only to write an essay severly inhitbited memory encoding and recall.

</br>

---
> [!info] Origianl paper: [Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task](https://arxiv.org/pdf/2506.08872)

> [!info] Summary of results: 
> *We believe that some of the most striking observations in our study stem from Session 4, where Brain-to-LLM participants showed higher neural connectivity than LLM Group's sessions 1, 2, 3 (network‑wide spike in alpha-, beta‑, theta‑, and delta-band directed connectivity). This suggests that rewriting an essay using AI tools (after prior AI-free writing) engaged more extensive brain network interactions. In contrast, the LLM-to-Brain group, being exposed to LLM use prior, demonstrated less coordinated neural effort in most bands, as well as bias in LLM specific vocabulary. Though scored high by both AI judge and human teachers, their essays stood out less in terms of the distance of NER/n-gram usage compared to other sessions in other groups. On the topic level, few topics deviated significantly and almost orthogonally (like HAPPINESS or PHILANTHROPY topics) in between LLM and Brain-only groups.*

## THOUGHTS
---

The use of LLMs for structured essays offers an advantage in efficiency when writing. Also apparent, after using LLMs for this purpose (a lot), the tenor and rhythm of each generated essay become melded together, with little difference in style. Unless specifically prompted, LLMs seem to use an annoying linguistic approach (even deep research) with too many lists and fluff similar to a product pitch or slide deck. It seems to lack depth, but it casts a wide net to gather information, which is necessary for the concise answers that the models provide. One could say that this is mostly solved in prompting techniques, but the more I've used these models for research, the more I run into the same wall with outputs; they are all easily identifiable as being written by a model (using zero-shot and one-shot prompting). Technical documents are less easy to spot as being generated, as lists and tables are usually required to support the material. 

Multi-shot system prompts for essay generation seem to produce results that appear to be much closer to a human-written essay at the surface level. If the user provides clear instructions about what they want to see, the outputs generated usually reflect the quality of the request, but I would bet that this does not reflect a large percentage of user interaction across all LLM users online. 

In the study, it's noted in the NLP discussion that "LLM and Search Engine groups were more inclined to focus on the output of the tools they were using because of the added pressure of limited time", which was 20 minutes. Even with the limited time (especially for essay writing), I think that the quality of the content would be severely limited because more focus is put on the plug-and-play aspect instead of a standard essay formulation. Yes, using LLMs for this exercise will generate more NERs per essay, but that doesn't mean that the quality increases. It might mean that the essay would be more technical, which would initially pose as better-formulated writing, but would lack the personal quality of brain-only and even search engine groups. Using my recent writings as an example, I can look over and compare several samples, each from a different generated report (say, out of notebooklm), and see the glaring similarities between all of the samples. They all appear to lack any sort of personality and instead focus on giving the reader the most concise content. This is all well and good for research summarizations and gathering quick data points, but not so much for presenting quality essays. 

> [!info] The human teachers pointed out how many essays used similar structure and approach (as a reminder, they were not provided with any details pertaining to the conditions or group assignments of the participants). In the top-scoring essays, human teachers were able to recognize a distinctive writing style associated with the LLM group (independent of the topic), as well as topic-specific styles developed by participants in both the LLM and Search Engine groups (see Figure 37). Interestingly, human teachers identified certain stylistic elements that were consistent across essays written by the same participant, often attributable to their work experience. In contrast, the AI judge failed to make such attributions, even after multi-shot fine-tuning and projecting all essays into a shared latent vector space.

After talking with an educator with 35 years of experience about this paper, he was not at all surprised by the findings and his in-classroom experience (teaching students and coaching public school teachers) post ChatGPT prevalence supported the fact that students will, more often than not, opt to offload cognitive process to a model that will do the leg work for them. It's already a major problem in universities, where the students try to game the system and the professors are blue teaming assignments, essays, and exams. This is not to say that the advent of autoregressive models is contributing to some catastrophic change in public and higher education. It seems that because the system is large and slow to change, the use of generative models appears to replace one's cognitive load and is an attribute that exacerbates the longstanding issues in American education. But let's not throw out the baby with the bathwater. We have all heard the notion of using technology for good, and while this should be the case everywhere, there is no avoiding the worst parts of ourselves (laziness, apathy, nihilism) that use technology as a crutch or, in many cases, a replacement for all thinking.

He said:

> *I was reading an article yesterday about how educators are fretting over student use of AI especially in writing. It’s gotten so bad and so prevalent that students are now having to go to great lengths to prove that the work is theirs (ex., using a program that tracks their keystrokes). Some college professors want to go back to like it was when I went to school - when having to turn in papers or writing pieces, technology is banned; only handwritten assignments on paper accepted, “blue books” for exams, no take-home tests, and no online courses. Their dreaming because colleges are making lots of money off online classes but it shows how far things have gone. As an educator I’m concerned that people don’t think anymore. Processing, reflecting, contemplating, and reasoning are no longer being done  - just push a button and “get the answer”. Very dangerous stuff*

I made a comment about the notion of "use it or lose it", referring to offloading cognitive processes to generative models and mentioned that one has to be intentional while using it, just like any other technology. He responded with:

> *And academic/learning issues always manifest in colleges first (because they are getting the “output” of the US education system) then trickles down to Secondary Education levels then Elementary school levels. This is going to be a huge problem that’s just now manifesting itself in high schools. And no easy answers - you can’t deny students access to technology but at the same time take away their opportunities to think and productively struggle with new ideas & concepts. I also think High Schools & especially Jr HS way overrate how much “learning” takes place when kids are on computers*

This could be seen as a take on the situation through a generational lens, which I do not fault him for as a multi-decade educator. The point here is to avoid falling into the trap where every paradigm-shifting technology is labelled a detriment to society. It's appropriate to attribute negative aspects to said technology, then, once those are identified, stakeholders in the system (i.e. education) should take the time to learn and bring in experts to properly integrate it. 

Some findings in the paper identified that compentency played a role in learning outcomes:

> [!info] There is also a clear distinction in how higher-competence and lower-competence learners utilized LLMs, which influenced their cognitive engagement and learning outcomes [[43](https://doi.org/10.48550/arxiv.2410.01396)]. Higher-competence learners strategically used LLMs as a tool for active learning. They used it to revisit and synthesize information to construct coherent knowledge structures; this reduced cognitive strain while remaining deeply engaged with the material. However, the lower-competence group often relied on the immediacy of LLM responses instead of going through the iterative processes involved in traditional learning methods (e.g. rephrasing or synthesizing material).

This brings up some of the possible experimental setup weaknesses of the study, like lacking some sort of LLM competency testing and grouping. This is not necessary to support their current findings, but it could possibly give the researchers a look into ways people with different model competencies use LLMs. Specifically, writing, when done well, requires much practice and offloading the hard work on the front-end of an essay to a model will not help you become a better writer. The applicable skills here would be idea formulation, identifying meaningful data points/content, creative wording structure, personalized editing preferences. The time limit could have inhibited higher-competency individuals from using methods of rephrasing or material synthesizing by relying more on the immediacy of LLM outputs to get the essay to the finish line. 

## COGNITIVE LOAD
---

In terms of using LLMs in educational environments, there needs to be an associated curriculum that teaches the best ways to use them, what each model excels at, and common mistakes that these models make. Like any user, proper use is paramnount to get the most out of the system. Most user prompts appear to be formulated to gather data points or answer a question that would have been previously entered into Google Search (pre-LLMs). Meaning, most users' prompts lack elements that would enhance the output, requiring the model to think more deeply or broadly, which may support the claim this paper makes about the effects of LLMs on cognitive load. It is not surprising that using an LLM, especially for a writing task, lowers germane cognitive load, as the task of retrieving information from memory or search affords the user (negatively) the space to bypass a certain amount of attention to and retention of details.

> [!info] the reduction of cognitive load leads to a shift from active critical reasoning to passive oversight. Users of GenAI tools reported using less effort in tasks such as retrieving and curating and instead focused on verifying or modifying AI-generated responses [[42](https://doi.org/10.1145/3706598.3713778)]

Reduction in cognitive load does not necessarily mean that the quality of work will be reduced by default. The positive side of this reduction is an increase in the speed of idea generation and a major reduction in the need to search and analyze vast amounts of data actively. So, the ability of the user to gather, collate, and summarize has drastically increased which can be a benefit when dealing with complex subjects that require many references and information resources. It turns research from a single input -- explicit narrow response (Google search), to a single input -- explicit wide response (ChatGPT). In the latter use case, the model reaches out to numerous sources, collates the information, and presents a summarized response. This type of response, while being concise, does not benefit long-form essay writing if the user relegates the rest of their work (post-prompt) to copying and pasting.



> [!info] Professor David Krakauer on [how LLMs might affect our cognition](https://x.com/MLStreetTalk/status/1943568151603745224) in the long run.

## FUTURE STUDIES
---

Things I would change in the study:
- larger group
- 1, 2, 8 hr time limits, 4 sessions in each timeframe, 
- Specific subject: i.e. how would you improve the world?
- LLM competency challenges to rate users who are then added to competency groups
  


</br>

...to be continued