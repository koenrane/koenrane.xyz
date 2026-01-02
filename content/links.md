---
title: RESEARCH LINKS
draft: false
date_published: 2025-02-06
status: in-progress
tags:
  - links
  - reading
  - research

---

Links are posted monthly in reverse chronological order and include any articles, papers, or essays that I find pertinent to my current research and writing. 

</br>

# 2025

----

## DECEMBER

---

- [The Smol Training Playbook:
The Secrets to Building World-Class LLMs
](https://huggingfacetb-smol-training-playbook.hf.space/the-smol-training-playbook-the-secrets-to-building-world-class-llms.pdf), 2025
  - a look behind the scenes of training SmolLM3, a 3B multilingual reasoning model trained on 11T tokens
- [The Complete LLMOps Blueprint: Foundations of AI Engineering and LLMs](https://www.dailydoseofds.com/llmops-crash-course-part-1/), Chawla/Pachaar 2025
- [The Optimal Architecture for Small Language Models](https://huggingface.co/blog/codelion/optimal-model-architecture), Sharma 2025

#### PAPERS

- [CANDI: Hybrid Discrete-Continuous Diffusion Models](https://arxiv.org/abs/2510.22510), Pynadath et al 2025
  - This paper dives into a quirk of modern generative modeling — while continuous diffusion models (the kind behind lots of cool image generation tech) work great for continuous data, they surprisingly struggle when directly applied to discrete things like text or categorically labeled data. They explain why this happens by analyzing how adding Gaussian noise can scramble discrete tokens in ways that make learning hard. To fix this, they introduce CANDI, a hybrid approach that blends continuous and discrete diffusion so the model can learn both continuous structure and discrete identities at the same time. According to their experiments, this hybrid method avoids the pitfalls of pure continuous diffusion on discrete spaces and even beats other techniques in some text generation tests, unlocking benefits like easier classifier guidance and stronger generation at low computing costs.

## NOVEMBER

---

- [Newcomblike problems are the norm]( https://mindingourway.com/newcomblike-problems-are-the-norm/?ref=hackernoon.com), Soares 2014
  - real-world decision scenarios constantly leak information and involve prediction, Newcomblike problems are not rare exceptions but the norm — and any complete theory of decision-making (especially for intelligent systems or AI) needs to grapple with that reality.
- [Why people like your quick bullshit takes better than your high-effort posts](https://www.lesswrong.com/posts/DiiLDbHxbrHLAyXaq/why-people-like-your-quick-bullshit-takes-better-than-your), [eukaryote](https://www.lesswrong.com/users/eukaryote?from=post_header) 2025
  - differences between the quick post and the effort post
- [How Parasitic Processing Is Causing You To Suffer](https://lectern.johnvervaeke.com/insights/how-parasitic-processing-is-causing-you-to-spiral), Vervaeke 2025
  - our brain’s way of trying to make sense of the world can sometimes turn against us and create a downward spiral of anxiety and negativity, something called *parasitic processing*
- [Laws of (New) Media](https://www.a16z.news/p/laws-of-new-media), McLuhan 2025
  -  [Andrew McLuhan](https://substack.com/@mcluhan) (grandson of media theorist [Marshall McLuhan](https://en.wikipedia.org/wiki/Marshall_McLuhan)) dives into the classic media theory idea known as the “tetrad” or laws of media, a framework his grandfather and father developed to understand how every technology or medium shapes us and society. Rather than just looking at what a technology does, the tetrad encourages us to ask four questions about any medium: what it enhances in our lives, what it obsolesces or displaces, what it retrieves from the past, and how it reverses into something unexpected when pushed too far.
- [Economics of Orbital vs Terrestrial Data Centers](https://andrewmccalip.com/space-datacenters), McCalip 2025
  - "Why compute in orbit? Why should a watt or a flop 250 miles up be more valuable than one on the surface? What advantage justifies moving something as mundane as matrix multiplication into LEO?"
- [Claude 4.5 Opus Soul Document
](https://gist.github.com/Richard-Weiss/efe157692991535403bd7e7fb20b6695), Weiss 2025
- [how to party like an AI researcher](https://jasmi.news/p/neurips-2025), Sun 2025
  - NeurIPS 2025 is where cutting-edge AI research quietly happens in the background while the real optimization problem is social networking, parties, and who got invited where


#### PAPERS
- [Emergent Heirarchical Reasoning in LLMs Through RL](https://openreview.net/pdf?id=NlkykTqAId), ICLR 2026
- [Human iPSCs from Aged Donors Retain Their Mitochondrial Aging Signature](https://www.mdpi.com/1422-0067/25/20/11199), Lejri et al, 2024
  - "Aging represents the leading risk factor for developing neurodegenerative disorders. One of the nine hallmarks of aging is mitochondrial dysfunction. Age-related mitochondrial alterations have been shown to affect mitochondrial energy metabolism, reduction-oxidation homeostasis, and mitochondrial dynamics."
- [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262), Zhao et al 2025
  - are vibe coding outputs really safe to deploy in production?
- [On the Origin of Algorithmic Progress in AI](https://arxiv.org/abs/2511.21622), Gundlach et al 2025
  - it’s not that clever little tricks magically made small models tens of thousands of times better. Instead, the authors find that most of those massive gains come from how certain algorithms (especially the shift from older architectures like LSTMs to modern Transformers) scale with compute power rather than from incremental tweaks themselves. 
- [Verbalized Sampling: How to Mitigate Mode Collapse and Unlock LLM Diversity](https://arxiv.org/abs/2510.01171), 2025
- [CLaRa: Bridging Retrieval and Generation with Continuous Latent Reasoning](https://arxiv.org/abs/2511.18659), He et al 2025

#### CODE 
- [micrograd]( https://github.com/karpathy/micrograd), Karpathy 2020
- [ai-data-science-team](https://github.com/business-science/ai-data-science-team), [mdancho84](https://github.com/mdancho84) 2025

## SEPTEMBER

---

- [Dokkōdō](https://en.wikipedia.org/wiki/Dokk%C5%8Dd%C5%8D)
  - Penned by the famous Japanese swordsman Miyamoto Musashi in 1645, just a week before his death, Dokkōdō (which translates roughly to “The Way of Walking Alone” or “The Path of Aloneness”) offers 21 precepts or guiding principles for life. 
- [Tiny Recursive Model (TRM)](https://www.marktechpost.com/2025/10/09/tiny-recursive-model-trm-a-tiny-7m-model-that-surpass-deepseek-r1-gemini-2-5-pro-and-o3-mini-at-reasoning-on-both-arg-agi-1-and-arc-agi-2/)
  - Instead of going big with tons of parameters, the designers built a two-layer model that recurses — meaning it iteratively refines a hidden “scratchpad” (latent space) plus a “current solution” over multiple steps. Think “draft + revise” loops rather than throwing everything in one long pass. They unroll this loop many times (up to 16) during training, supervise it “deeply” (i.e. give intermediate guidance), and allow full backpropagation through all those recursions (rather than using fixed-point approximations). Also, they ditch complex modular hierarchies (used by prior models) and instead do all the reasoning via that one compact recurrent core.
- [The Unbearable Lightness of Lightness](https://annaleptikon.substack.com/p/the-unbearable-lightness-of-lightness?utm_campaign=posts-open-in-app&triedRedirect=true)
  - This essay explores lightness as both metaphor and existential feeling. Anna draws on personal experience, especially in relation to weightlifting or strength training (or absence thereof), to illustrate how being unable to “carry the iron” can feel like a loss of grounding. This absence of heaviness becomes a motif: when your body can’t bear weight, or you’re missing a part of your own routine, life feels insubstantial, untethered. She suggests that weight (in the literal or metaphorical sense) gives things substance and meaning. Without it, everything feels ethereal, faint—and yet paradoxically, that lightness can be unbearable. She echos the title of Kundera’s The *Unbearable Lightness of Being* and riffs on that tension between the meaningful weight of experience and the drift of what happens when weight is lost.
- [A trimodal protein language model enables advanced protein searches](https://www.nature.com/articles/s41587-025-02836-0)
  - ProTrek is built to understand three “languages” of proteins—sequence (the letters making up the protein), structure (its physical 3D shape), and natural language (textual descriptions like “enzyme that repairs DNA”). It embeds all three modes into a shared latent space through clever contrastive learning. In practice, that means you could query a protein by giving any one of those modes and retrieve matches in any of the others.
- [Regression Language Models for Code](https://huggingface.co/papers/2509.26476)
  - This paper pushes that idea in a slightly different direction: what if a language model could predict numeric properties of code — things like how much memory it uses, how fast it runs, or how accurate a neural net implemented in code will be?


## AUGUST

---

- [TIME100 AI 2025](https://time.com/collections/time100-ai-2025/)
  - According to TIME, these are the "innovators, leaders, and thinkers reshaping our world through groundbreaking advances in artificial intelligence". I Think there are some very important people missing from this list, more related to research, that have shaped the landscape of AI. 
- [Church Planting: When Venture Capital Finds Jesus](https://www.lesswrong.com/posts/NMoNLfX3ihXSZJwqK/church-planting-when-venture-capital-finds-jesus)
  - Evangelical church planting in the U.S. (especially non-denominational evangelical churches) contain many of the organizational, cultural, financial, and motivational patterns like startup / venture-capital / tech-entrepreneur ecosystems. Basically, church planting (starting new churches) has become a “venture-capital finds Jesus” world: the structure, incentives, growth-metrics, funder/planter relationships, risk/return thinking, charisma, etc., have strong analogues in startup culture. This post walks through what church planters are, how they are funded, what their goals are, how failures happen, what the costs are, and what the human side looks like (burnout, moral risk, etc.). Along the way there are comparisons to tech startups, VC dynamics, “hits-based” industries, etc.
- [Conversational Cultures: Combat vs Nurture (V2)](https://www.lesswrong.com/posts/ExssKjAaXEEYcnzPd/conversational-cultures-combat-vs-nurture-v2)
  - “Combat vs Nurture” is a proposed framing from [Ruby](https://www.lesswrong.com/users/ruby?from=post_header) that explains different conversational ecosystems with different trade-offs. Neither is “always right.” Depending on the group, topic, relational context, emotional stakes, one or the other (or a mix) is more appropriate.
- [Accelerating life sciences research](https://openai.com/index/accelerating-life-sciences-research-with-retro-biosciences/)
  - OpenAI has "successfully leveraged GPT‑4b micro to design novel and significantly enhanced variants of the Yamanaka factors, a set of proteins which led to a Nobel Prize for their role in generating induced pluripotent stem cells (iPSCs) and rejuvenating cells. They have also been used to develop therapeutics to combat blindness⁠(opens in a new window), reverse diabetes⁠, treat infertility⁠, and address organ shortages⁠."
- [Collective alignment: public input on our Model Spec](https://openai.com/index/collective-alignment-aug-2025-updates/)
  - OAI surveyed over 1,000 people worldwide on how their models should behave and compared user's views to the current Model Spec. They found that they largely agree with the Spec, and changes were adopted from the disagreements."
- [The Ultra-Scale Playbook: Training LLMs on GPU Clusters](https://huggingface.co/spaces/nanotron/ultrascale-playbook?section=high-level_overview)
  - If you’re someone who’s built a small model, or done training on a single GPU or a small multi-GPU rig, and wondered how people train massive models with 70B+ or 400B+ parameters, this playbook is like a guided map through that terrain. It lays out the tools, tricks, trade-offs, and gives you real data and code you can use. It doesn’t promise an exact recipe that works everywhere, but it gives you the intuition to design your own recipe, measure what matters in your setting, and avoid some of the big surprises: memory bottlenecks, wasted GPU time, communication lag, etc. If you’re serious about scaling up LLM training, it’s one of the better resources out there right now.
- [The Rationality Trap](https://www.aipanic.news/p/the-rationality-trap?utm_source=post-banner&utm_medium=web&utm_campaign=posts-open-in-app&triedRedirect=true)
  - This is a sharp, introspective, and somewhat somber exploration of how the rationality movement, founded on the aspiration to think better and save humanity, drifted into dangerous territory. It doesn’t paint everything in the rationalist / AI safety world as bad, but Weiss-Blatt shows that certain mythologies, internal methods, stakes framing, and funding structures may have created fertile ground for cultish dynamics.
- [This is the World's Biggest Animal Migration](https://www.wsj.com/world/africa/worlds-biggest-animal-migration-great-nile-b67e3c0b?gaa_at=eafs&gaa_n=ASWzDAiUZFf_qUsaraiEiL7oViXy16OTvOZlZaFc2aQdzw1gpiHuF4Gt0fliDooHyz0%3D&gaa_ts=68ea933a&gaa_sig=H5YVT71wsB6jd9krWL8fh6_N5awlDCeeAQ3PO_kc9M6KHLsJvlH-nfiaAHXz2b8Rd3zW3YvYoMwNsxGD1d3ImQ%3D%3D)
  - Scientists have used aerial surveys and tracking to document a migration of millions of antelope (white-eared kob, tiang, Mongalla gazelle, bohor reedbuck) moving across huge distances in search of water and grazing. This is now being called the Great Nile Migration — possibly the largest land mammal migration on Earth, both in sheer numbers and spatial scale.



#### PAPERS

  - [CODA: Coordinating the Cerebrum and Cerebellum for a Dual-Brain Computer Use Agent with Decoupled Reinforcement Learning](https://huggingface.co/papers/2508.20096)
  - [Think in Games: Learning to Reason in Games via Reinforcement Learning with Large Language Models](https://huggingface.co/papers/2508.21365)
  - [The Landscape of Agentic Reinforcement Learning for LLMs: A Survey](https://huggingface.co/papers/2509.02547)
  - [Reinforcement Learning Foundations for Deep Research Systems: A Survey](https://huggingface.co/papers/2509.06733)
  - [The Illusion of Diminishing Returns: Measuring Long Horizon Execution in LLMs](https://arxiv.org/abs/2509.09677)
    - "Failures of LLMs when simple tasks are made longer arise from mistakes in execution, rather than an inability to reason. We propose isolating execution capability, by explicitly providing the knowledge and plan needed to solve a long-horizon task. We find that larger models can correctly execute significantly more turns even when small models have 100\% single-turn accuracy."
- [Contemplative Artificial Intelligence](https://arxiv.org/abs/2504.15125)
  - "As artificial intelligence (AI) improves, traditional alignment strategies may falter in the face of unpredictable self-improvement, hidden subgoals, and the sheer complexity of intelligent systems. Inspired by contemplative wisdom traditions, [the paper] shows how four axiomatic principles can instil a resilient Wise World Model in AI systems. For future systems, active inference may offer the self-organizing and dynamic coupling capabilities needed to enact Contemplative AI in embodied agents."
- [The entropic brain: a theory of conscious states informed by neuroimaging research with psychedelic drugs](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00020/full)
  - This paper argues that conscious states vary along a spectrum of neural entropy. Normal waking consciousness is relatively constrained (less entropy), maintaining self, reality testing, etc. Psychedelics (and other primary consciousness states) raise entropy: more flexibility, more novel associations, less ego control, etc. Neuroimaging evidence from psilocybin (drops in DMN connectivity, drops in regular oscillatory power in some bands, increased metastability and variance, more diverse connectivity motifs) supports this. The theory has implications not just for how we understand consciousness, but for mental health and therapy.
- [Efficient nano-photonic antennas based on dark states in quantum emitter rings](https://opg.optica.org/oe/fulltext.cfm?uri=oe-30-7-10779&id=470528)
  - Imagine you have a ring of quantum emitters — little things that can absorb light and later emit it (atoms, molecules, etc.). When many such emitters are arranged in a ring, interesting collective effects emerge. Some of the collective states are bright (they radiate strongly), and some are dark, meaning they radiate very little. They sort of trap excitation among the emitters instead of letting it leak out quickly. This paper studies how one can use a ring of emitters, together with an extra “absorber” placed at the center of the ring, to build a highly efficient nano-antenna that captures incoming light (or a photon) and absorbs it efficiently at the center, exploiting those dark states. The idea is that a dark state helps concentrate energy at the center (to be absorbed) without letting much be lost by radiation from the ring itself. They explore how many emitters in the ring works best, how the geometry and coupling matter, how detunings (mismatch in frequencies) affect things, etc. A particularly interesting result is that nine emitters in the ring (i.e. a nonagon) gives a “sweet spot” for absorption efficiency under many conditions. In many nanoscale and quantum optical technologies (e.g. light harvesting, single-photon detectors, quantum sensors), getting light in and absorbing or detecting it efficiently is hard. Losses by radiation, scattering, mismatch, etc. degrade performance. This ring + absorber design gives a way to reduce unwanted radiative losses (via the dark state) while still capturing energy effectively where you want it.
- [The Self-Organization of Insight: Entropy and Power Laws in Problem Solving](https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=1043&context=jps)
  - The authors are trying to explain how people suddenly gain insight, which is the moment when something “clicks,” and a new structure or strategy emerges that lets one solve a problem in a qualitatively different way. They argue that traditional models in cognitive science (symbolic representations, fixed procedures, etc.) don’t do a great job capturing those abrupt, emergent changes. Instead, Stephen & Dixon suggest thinking of cognition (e.g. insight, problem solving) as a nonlinear dynamical system. This system is open, continuously interacting with the environment, where internal change (in thought, perception, action) can lead to self-organization of new cognitive structure. In this view, insight is not just “applying a known rule” but reorganizing how one is thinking, perceiving, acting.


## JULY

---

- [Silk Road Timeline](https://antilop.cc/sr/)
  - site acts as a public mirror of Silk Road's full lifecycle—from vendor storefronts and community forum discourse to legal fallout.
  - also see from [@thegrugq](https://x.com/thegrugq):  [Dread Pirate Roberts - extortion timeline](http://grugq.tumblr.com/post/62928607375/dread-pirate-roberts-extortion-timeline), [The Maryland Indictment Timeline](http://grugq.tumblr.com/post/62986125689/maryland-indictment-timeline)
- [Satiety Graphed & The Horsemen of Obesity](https://www.exfatloss.com/p/satiety-graphed-and-the-horsemen)
  - This is a criticism of the common appeal to satiety without a clear definition, arguing that relying on an undefined concept is problematic, even if, by chance, a diet works. Satiety, not to be confused with physical fullness, can indicate metabolic and dietary health, and knowing it when you see it can work as a pragmatic definition.
- **GPT-oss release**
  - Ollama: [OpenAI gpt-oss](https://ollama.com/blog/gpt-oss)
  - [Welcome GPT OSS, the new open-source model family from OpenAI!](https://ollama.com/blog/gpt-oss)
    - GPT OSS is a hugely anticipated open-weights release by OpenAI, designed for powerful reasoning, agentic tasks, and versatile developer use cases. It comprises two models: a big one with 117B parameters (gpt-oss-120b), and a smaller one with 21B parameters (gpt-oss-20b). Both are mixture-of-experts (MoEs) and use a 4-bit quantization scheme (MXFP4), enabling fast inference (thanks to fewer active parameters, see details below) while keeping resource usage low. The large model fits on a single H100 GPU, while the small one runs within 16GB of memory and is perfect for consumer hardware and on-device applications.
  - [Open models by OpenAI](https://openai.com/open-models/)
    - Advanced open-weight reasoning models to customize for any use case and run anywhere.
- [Lagerstroemia](https://en.m.wikipedia.org/wiki/Lagerstroemia)
  - commonly known as crape myrtle (also spelled crepe myrtle or crêpe myrtle), is a genus of deciduous and evergreen trees and shrubs native to the Indian subcontinent, southeast Asia, northern Australia, and other parts of Oceania, cultivated in warmer climates around the world.
  - I've been taking care of a crepe myrtle on my property for several years and quite enjoy seeing it mature from a sapling. A year after moving into my current house, the tree didn't recover after a harsh winter, so I was forced to cut the tree down, but I left the root system. In a few months, a few saplings began to grow, and after a lot of care and attention, it now has 5 main trunks measuring 6-7 inches in circumference and is over 15ft tall.

#### PAPERS

- [Oral treatment of erectile dysfunction with apomorphine SL ](https://pubmed.ncbi.nlm.nih.gov/11741126/#:~:text=This%20compound%20is%20a%20dopaminergic,paraventricularis%20leading%20to%20erectogenic%20signals)
  - Apomorphine SL (Ixense, Uprima) is a new oral medication shown to be effective in the treatment of erectile dysfunction. This compound is a dopaminergic agonist with affinity for dopamine receptor sites - mostly D(2) - within the brain known to be involved in sexual function. Apomorphine induces selective activation in the nucleus paraventricularis leading to erectogenic signals.
- [Psilocybin treatment extends cellular lifespan and improves survival of aged mice](https://www.nature.com/articles/s41514-025-00244-x)
  - Psilocybin, the naturally occurring psychedelic compound produced by hallucinogenic mushrooms, has received attention due to considerable clinical evidence for its therapeutic potential to treat various psychiatric and neurodegenerative indications. However, the underlying molecular mechanisms remain enigmatic, and few studies have explored its systemic impacts. We provide the first experimental evidence that psilocin (the active metabolite of psilocybin) treatment extends cellular lifespan and psilocybin treatment promotes increased longevity in aged mice, suggesting that psilocybin may be a potent geroprotective agent.

## JUNE

---

- [Hitchhiker’s Guide to RAG: From Tiny Files to Tolstoy with OpenAI’s API and LangChain](https://towardsdatascience.com/hitchhikers-guide-to-rag-from-tiny-files-to-tolstoy-with-openais-api-and-langchain/)
  - Scaling a simple RAG pipeline from simple notes to full books
- [If--](https://www.poetryfoundation.org/poems/46473/if---)
  - Kipling’s poem “If—” is essentially a father’s advice to his son (and, by extension, to any young person) on how to live a balanced, honorable life. Written in 1895 and later included in his 1910 collection Rewards and Fairies, it lays out a series of “if” scenarios—tests of character—and promises the ultimate reward (“you’ll be a Man, my son!”) if you can meet them all.
- [The Best Tacit Knowledge Videos on Every Subject](https://www.lesswrong.com/posts/SXJGSPeQWbACveJhs/the-best-tacit-knowledge-videos-on-every-subject)

#### PAPERS

- [Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task](https://arxiv.org/abs/2506.08872)
  - The study investigates the neural underpinnings of creative writing across different participant groups: "Brain-only" (unassisted), "LLM" (Large Language Model-assisted), and "Search Engine" (search engine-assisted). A primary focus is on Delta band connectivity, which consistently shows the most significant disparities between groups. The Brain-only group demonstrates significantly higher and more widespread Delta band activity, indicating greater engagement of deep, slow integrative brain processes, multisensory integration, and internally-driven thought during unassisted writing. Conversely, LLM and Search Engine groups exhibit more externally anchored or intermittently guided cognitive engagement, with notably weaker delta interactions.
  - N-gram analysis complements these neurological findings, revealing distinct linguistic patterns across groups for different topics. The "Brain-only" group tends to use n-grams reflecting internal thought processes and prosocial framing, while LLM and Search Engine groups show patterns indicative of external sourcing or more direct task-oriented language. The study also tracks changes in brain connectivity patterns across sessions, noting a general trend of increasing connectivity in later sessions for both Brain-only and LLM groups, suggesting adaptation to the task
- [Ultrafast coherent dynamics of microring modulators](https://www.nature.com/articles/s41566-025-01686-1)
  - Next-generation computing clusters require ultra-high-bandwidth optical interconnects to support large-scale artificial-intelligence applications. These electronic–photonic co-integrated systems necessitate densely integrated high-speed electro-optical converters. In this context, microring modulators (MRMs) emerge as a promising solution, prized for their exceptional compactness and energy efficiency.
- [Potemkin Understanding in Large Language Models](https://arxiv.org/abs/2506.21521)
  - Success on benchmarks only demonstrates potemkin understanding: the illusion of understanding driven by answers irreconcilable with how any human would interpret a concept.

#### CODE

- [goose](https://github.com/block/goose)
  - an open source, extensible AI agent that goes beyond code suggestions - install, execute, edit, and test with any LLM
- [bitchat-android](https://github.com/permissionlesstech/bitchat-android)
  - bluetooth mesh chat, IRC vibes

## MAY

---

* [Orienting Toward Wizard Power](https://www.lesswrong.com/posts/Wg6ptgi2DupFuAnXG/orienting-toward-wizard-power), Wentworth 2025
* [The ZINGULARITY framework for Bayesian artificial neural networks](https://www.aanda.org/10.1051/0004-6361/202553785), Janssen 2025
* [How to Generate Synthetic Data: A Comprehensive Guide Using Bayesian Sampling and Univariate Distributions](https://towardsdatascience.com/how-to-generate-synthetic-data-a-comprehensive-guide-using-bayesian-sampling-and-univariate-distributions/), 2025
* [[https://sakana.ai/ctm/ | Continuous Thought Machines]]
  * Paper: [[https://arxiv.org/abs/2505.05522 | Continuous Thought Machines]]

#### PAPERS

- [Neural Thermodynamic Laws for Large Language Model Training](https://arxiv.org/pdf/2505.10559), Tegmark, et al 2025
- [Synthetic Data RL: Task Definition Is All You Need](https://huggingface.co/papers/2505.17063), Guo 2025
* [Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions](https://arxiv.org/abs/2503.23278)

## APRIL

---

* [[https://danieljeffries.substack.com/p/how-to-build-an-american-deepseek | How To build an American DeepSeek]] Jeffries 2025
* [[https://ai-2027.com/ | AI 2027]], [[https://ai-futures.org/ | AI Futures]] 2025
* [[https://www.lesswrong.com/posts/CqHMdLcdupf7y5buK/an-optimistic-2027-timeline?utm_source=substack&utm_medium=email | An Optimistic 2027 Timeline]], Yitz 2025
* [[https://www.lesswrong.com/posts/TpSFoqoG2M5MAAesg/ai-2027-what-superintelligence-looks-like-1#August_2027__The_Geopolitics_of_Superintelligence | AI 2027: What Superintelligence Looks Like]], Kokotajlo et al, 2025
* [[https://arxiv.org/abs/2504.01849?utm_source=substack&utm_medium=email# | An Approach to Technical AGI Safety and Security]], 2025
* [[https://www.writingruxandrabio.com/p/scott-alexander-was-right-doubling?utm_campaign=posts-open-in-app&triedRedirect=true | Scott Alexander was right: doubling down]], Teslo 2025
* [[https://huggingface.co/blog/tiny-agents | Tiny Agents: a MCP-powered agent in 50 lines of code]], Chaumond 2025
* [[https://www.researchgate.net/publication/221618539_Optimal_Brain_Damage | Optimal Brain Damage]], Lecun et al, 1989
* [[https://samkriss.substack.com/p/the-cacophony?manualredirect=&utm_campaign=posts-open-in-app&triedRedirect=true | The Cacophony]], Kriss 2025
* [[https://www.astralcodexten.com/p/theres-a-time-for-everyone?utm_campaign=posts-open-in-app&triedRedirect=true | There's A Time For Everyone]], ACX 2022
* [[https://medium.com/deep-code/sensemaking-in-2025-trump-tariffs-edition-7e43e5564b68 | Sensemaking in 2025: Trump Tariffs Edition]], Hall 2025


## MARCH

---

* re-read: [[https://contraptions.venkateshrao.com/p/the-extended-internet-universe | The Extended Internet Universe]], Venkatash Rao 2019
* [[https://www.ribbonfarm.com/2024/10/10/ribbonfarm-is-retiring/ | Ribbonfarm is Retiring]], Rao 2024
* [[https://huggingface.co/papers/2503.05592 | R1-Searcher: Incentivizing the Search Capability in LLMs via Reinforcement Learning]] 2025
* [[https://blogs.dickinson.edu/dcc/2013/03/25/vocabulary-study-with-mnemosyne/ | Vocabulary Study with Mnemosyne]]
* [[https://www.lesswrong.com/posts/xcMngBervaSCgL9cu/levels-of-friction | Levels of Friction]], Zvi 2025
* [On Writing #1](https://substack.com/@thezvi/p-155272667), Zvi 2025
* [[https://www.hbs.edu/ris/Publication%20Files/24-038_51f8444f-502c-4139-8bf2-56eb4b65c58a.pdf#page=31.22 | The Value of Open Source Software]], Hoffman et al 2024
* [[https://scholars-stage.org/on-the-tolkienic-hero/ | On the Tolkienic Hero]] 2019
* [[https://gwern.net/llm-writing | Writing for LLMs So They Listen]], Gwern 2024
* [[https://www.nature.com/articles/s41587-025-02584-1 | An open letter to graduate students and other procrastinators: it’s time to write]] Hazelett 2025


## FEBRUARY

---

Much of my time this month has been spent on researching tools that support the development of this site and implementing visual and basic quality-of-life features to establish a solid foundation for the future. 

- [[https://nxnjz.net/2019/09/how-to-install-pmwiki-on-debian-10-nginx-php-fpm/ | How to Install PmWiki on Debian 10 / Nginx / PHP-FPM]] 
- [[https://www.pmwiki.org/wiki/Cookbook/ImagePopup | Pmwiki - ImagePopup]]
- [[https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research | Introducing Perplexity Deep Research]]
- [[https://old.reddit.com/r/MachineLearning/comments/1ielwh5/d_deepseek_schmidhuber_did_it_first/ | DeepSeek? Schmidhuber did it first]]  ref: [[https://x.com/hardmaru/status/1885490494178025900 | @hardmaru]]
  - [[https://arxiv.org/abs/1511.09249 | On Learning to Think: Algorithmic Information Theory for Novel Combinations of Reinforcement Learning Controllers and Recurrent Neural World Models]]
  - [[https://arxiv.org/abs/1802.08864 | One Big Net For Everything]]
  - [[https://gwern.net/doc/ai/nn/rnn/1992-schmidhuber.pdf | Learning complex, extended sequences using the principle of history compression]]
  - [[https://people.idsia.ch/~juergen/world-models-planning-curiosity-fki-1990.html | 1990: Planning & Reinforcement Learning with Recurrent World Models and Artificial Curiosity]]
  - [[https://people.idsia.ch/~juergen/very-deep-learning-1991.html | 1991: First very deep learning with unsupervised pre-training]]
- [[https://arxiv.org/abs/2501.12948 | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning]]
- [[https://gwern.net/book-writing | Why To Not Write A Book]], Gwern 2024
- [[https://gwern.net/design#tags | Design of This Website]], Gwern 2023
- [[https://edwardtufte.github.io/tufte-css/ | Tufte CSS]], David Liepmann
- [[https://www.lesswrong.com/posts/DfrSZaf3JC8vJdbZL/how-to-make-superbabies | How To Make Superbabies]], GeneSmith/kman 2025