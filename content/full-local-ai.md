---
permalink: ai-implementation
publish: "true"
title: "SO YOU WANT TO RUN YOUR OWN AI STACK?"
description: this doc shares three proposals on how to implement an AI system locally or fully on prem.
date_published: 2025-11-24
status: in-progress
tags:
  - AI
  - hosting
  - architecture
  - hardware
---

In this post, I try provide a detailed examination of the technical considerations that I see are essential for implementing AI applications using a self-hosted, local system.

## SUMMARY

---

The first proposal takes the modular route—an attempt to maximize flexibility, scalability, and long-term ownership of as much of the tech stack as you can reasonably claim. The framework walks through every major layer, starting from the hardware (specialized compute, high-speed networking, storage) and moving upward through data management, MLOps orchestration, and the usual security/privacy scaffolding. The point of all this modularity is both practical and philosophical: you avoid waking up one day to discover you’ve married a vendor you barely meant to date, and you preserve enough autonomy to change direction without triggering procurement melodrama.

The second architecture is deliberately lighter—a kind of “minimum viable sophistication” option. It relaxes many of the constraints that the modular approach tries so hard to control, but in return, it demands far less operational metabolism and far fewer dollars. For most organizations, this is the saner first experiment. The idea is to integrate state-of-the-art external LLMs into an on-prem environment via a controlled API boundary, fronted by a custom application layer. Sensitive data and core logic stay inside the perimeter; the frontier models stay outside, on the other end of an encrypted pipe. You get the benefits of cutting-edge capability without dumping your entire internal corpus into someone else’s pretraining set. (OpenAI’s [recent initiative](https://openai.com/global-affairs/introducing-openai-for-government/) to bring its top-shelf models to [government environments](https://openai.com/index/providing-chatgpt-to-the-entire-us-federal-workforce/) is making this approach more attractive than it used to be.) The proposal spells out each layer—from the UI to the hardware—framed around secure data flow, orchestration, and compliance theater that, in this case, actually matters.

The third architecture is the maximalist local option: a fully self-contained RAG system that uses internal document stores and a locally hosted model accessed through an internal API. This is the cleanest way to get a secure RAG pipeline without depending on external compute, but it’s subject to the harsh reality of whatever hardware is currently humming in your server closet. Model size becomes a real constraint—less a theoretical limit and more an immediate negotiation with your GPUs. Still, for organizations that treat data sovereignty as a non-negotiable, this is the purest expression of that philosophy.

## ON PREM

---

### THE CASE FOR ON PREM

---

The architecture here assumes a site that—sensibly—wants fairly tight control over its data, compute, and intellectual property, while still expecting the usual modern conveniences: high performance, horizontal scaling, and the ability to change its mind in six months without rebuilding everything from scratch. There are many possible architectural permutations (the combinatorics start to look like a real problem if you try enumerating them), but a self-hosted, modular design gives you an unusual amount of leverage: you get to choose, piece by piece, what the stack is instead of inheriting whatever a vendor thinks “should be fine for most customers.”

A modular AI architecture, in practice, is just a collection of small, reasonably self-sufficient components—call them “modules,” “microservices,” or “interfaces disguised as Docker containers.” They don’t care much about one another beyond shared contracts, which is precisely the point. Compared to monoliths (which tend to fossilize over time as any change threatens the whole organism), modularity has several advantages that become painfully obvious in on-prem AI systems:

- Flexibility / Adaptability: Because each module is isolated behind a stable interface, you can replace parts with surprising impunity. New embedding model? Swap it. Different preprocessing pipeline? Drop it in. Entire workflow experiment that probably won’t survive contact with reality? Spin it up anyway. The rest of the system barely notices. (This is the difference between “we can test that next quarter” and “give me an hour.”)
- Scalability: Modules scale independently, which sounds trivial until you need it. A vector database under load doesn’t mean your inference layer also needs more GPUs; the log ingestion service choking on a sudden firehose doesn’t require doubling the compute for everything else. Horizontal scaling becomes an optimization exercise rather than a blunt-instrument solution.
- Maintainability: Debugging [monoliths](https://en.wikipedia.org/wiki/Monolithic_application) is archaeology. Debugging modules is more like plumbing: annoying, but local. A failure in one component tends not to metastasize through the system, and recovery time collapses as a result. You fix the broken thing rather than guessing which sedimentary layer contains the fault.
- Vendor Independence: By sticking to open APIs, open formats, and containerized components, you erode your reliance on any single vendor’s ecosystem. If a provider decides to adjust their licensing terms in a particularly “visionary” way, or if a new open-source model outperforms the old one overnight (which now happens often enough to be a scheduling hazard), you can switch with minimal ceremony.
- [Hybrid Deployment](https://www.cloudflare.com/learning/cloud/what-is-hybrid-cloud/): You can keep the sensitive stuff—proprietary data, regulated workflows, anything with compliance teeth—on-prem, while shunting overflow tasks to the cloud when needed. A kind of hybrid vigor emerges: the reliability of local infrastructure with the elasticity of outsourced compute, without knuckling under to either extreme.

### ON-PREM LLM DEPLOYMENT

---

An on-prem LLM deployment, done properly, is mostly about security and control—real control, not the “we have a dashboard” kind. The tricky part isn’t getting the first version running (that’s usually just a matter of wiring together enough pieces that nothing bursts into flames), but scaling it beyond the prototype phase. Still, this approach lets a single site integrate AI into its existing infrastructure without reinventing its security posture or punching new holes in the network perimeter.

If the long-term plan is genuine self-sufficiency—meaning you not only host the hardware but also intend to avoid the gravitational pull of proprietary APIs—then open-source models become the obvious path. They give you transparency, reproducibility, and a steady stream of community-driven benchmarks that act as a kind of informal peer review. More importantly, they’re modifiable: you can fine-tune them, prune them, distill them, or otherwise reshape them without needing a vendor’s blessing or fearing that tomorrow’s pricing update will quietly invalidate months of planning.

Model Selection and Prep:

- You start by choosing a model family—[LLaMA](https://www.llama.com/) [3.x](https://www.llama.com/models/llama-3/)/[4.x](https://www.llama.com/models/llama-4/), [Mistral](https://huggingface.co/mistralai), [Kimi](https://moonshotai.github.io/Kimi-K2/), [Olmo](https://allenai.org/blog/olmo3), [OpenAI oss](https://openai.com/index/introducing-gpt-oss/), or whatever other prefernce you may have. The usual workflow applies: download the weights, quantize them if your hardware budget demands frugality, and sanity-check that the model actually behaves inside your security envelope. (Models will happily run in environments you wish existed, so validation is non-negotiable.)

Infrastructure Provisioning:

- Next comes the ritual sacrifice to infrastructure: GPU servers or a private cloud, container runtimes like Docker, an orchestrator like Kubernetes if you enjoy declarative pain, and storage layers that won’t collapse under sustained reads. This is also the moment to bake in access controls rather than bolting them on later—AD groups, server policies, compliance gates, the usual bureaucracy that everyone hates until the instant it prevents a disaster.

Inference Engine Integration:

- Once the hardware stops complaining, you load the model into an inference engine—vLLM, lmdeploy, sglang, etc. These are the systems that make the LLM responsive enough for real-time use: [batching](https://medium.com/@yohoso/llm-inference-optimisation-continuous-batching-2d66844c19e9), [streaming](https://www.vellum.ai/llm-parameters/llm-streaming?utm_source=google&utm_medium=organic), [KV cache tricks](https://huggingface.co/docs/transformers/main/kv_cache), [memory reclamation](https://arxiv.org/pdf/2411.12893), and a small zoo of optimizations that collectively make the model feel faster than the raw [FLOPs](https://en.wikipedia.org/wiki/Floating_point_operations_per_second) imply.

Internal REST API Exposure:

- Internally, you expose all of this behind a [REST API](https://arxiv.org/html/2504.15546v1). This becomes the clearinghouse for application access—multi-model routing, per-service authentication, rate limiting, and whatever governance policies your organization insists on. (A surprising amount of “LLM architecture” ends up being about corralling requests rather than generating text.)

Monitoring and Scaling:

- Finally, you observe it. Relentlessly. Performance, GPU memory pressure, token throughput, odd security events, pathological prompts that melt your KV cache—everything. Scaling becomes an ongoing negotiation between demand and the hardware that must satisfy it. With enough instrumentation, you eventually develop a feel for when the system is healthy—or about to do something expensive.

### ADVANTAGES

---

On-prem AI deployment offers a kind of sovereignty and customizability that cloud platforms only gesture at—along with a pleasantly legible cost structure, which is rare in a world where “usage-based billing” often feels like a polite synonym for surge pricing. By keeping every byte of input and output inside your own walls, you regain full control over sensitive data and sidestep the uneasy reliance on third-party APIs. Everything falls under your internal security regime, which—while occasionally irritating—at least answers to you.

You also get to look under the hood of the models you select. With direct access to weights and architectures, the organization can fine-tune models on proprietary datasets, sculpting behavior to fit actual domain needs rather than hoping a generalist model magically extrapolates. The upfront capital expenditure (servers, cooling, power, the quiet horror of enterprise-grade racks) is undeniably high, but what you get in return is freedom from per-token billing. Instead of paying an ever-growing tax to an API endpoint, you get a predictable operating budget—which can matter enormously in latency-sensitive or high-volume workflows that turn cloud costs into a rounding error of doom.

For organizations under strict regulatory mandates—or government sites dealing with clearance-bound information—an air-gapped inference layer becomes the ultimate guarantee: zero data crosses network boundaries, and “updates” arrive as physically transported, verified bundles. Everything else lives inside a [zero-trust perimeter](https://en.wikipedia.org/wiki/Zero_trust_architecture) of [signed binaries](https://en.wikipedia.org/wiki/Code_signing), [immutable containers](https://medium.com/@h.stoychev87/containerization-docker-and-containers-8e8f28fd0694), [multi-factor gates](https://en.wikipedia.org/wiki/Multi-factor_authentication), and audit [sandboxes](https://en.wikipedia.org/wiki/Sandbox_(computer_security)) (the black boxes into which all mysteries eventually flow).

A quick breakdown:

- Offline Model Serving: Models deployed in environments with no external connectivity.
- Data Isolation: Input/output data never crosses network boundaries.
- Zero Dependency: Inference occurs without external API calls.
- Secure Updates: Offline update bundles are imported via trusted physical methods, undergoing internal validation and logging.
- Zero Trust Architecture: Verification of every model, user, and API call(internal REST) to protect against insider threats and rogue execution.

### MODULAR OVERVIEW

---

- Hardware & AI Datacenter Enablers (Bottom Layer):
  - Raw physical hardware (GPUs, CPUs, TPUs), cloud services, high-speed networking, cooling, and virtualization.
  - vendors:
    [NVIDIA](https://www.nvidia.com),
    [AMD](https://www.amd.com),
    [AWS](https://aws.amazon.com),
    [Google Cloud](https://cloud.google.com),
    [Oracle](https://www.oracle.com/cloud/),
    [Seagate](https://www.seagate.com),
    [Supermicro](https://www.supermicro.com),
    [Juniper](https://www.juniper.net)

- Data Structure & Processing (Bottom Layer):
  - Transforms raw data into structured, machine-readable formats (storage, integration, cleaning, normalization, embedding).
  - vendors:
    [Pinecone](https://www.pinecone.io),
    [Boomi](https://boomi.com),
    [Tecton](https://www.tecton.ai),
    [Alteryx](https://www.alteryx.com),
    [Milvus](https://milvus.io),
    [Superlinked](https://www.superlinked.com)
    - Data quality at this layer is critical for model accuracy.

- Model Development & Deployment (Middle Layer):
  - Core AI intelligence-building (training, fine-tuning, deployment, operationalization), supported by ML frameworks (TensorFlow, PyTorch) and compute providers.
  - Key players:
    [OpenAI](https://openai.com),
    [Anthropic](https://www.anthropic.com),
    [Labelbox](https://labelbox.com),
    [Hugging Face](https://huggingface.co),
    [Meta](https://ai.meta.com),
    [Mistral](https://mistral.ai),
    [Qwen](https://qwen.ai)

- Inference (Middle Layer):
  - Efficient execution of deployed models at scale, handling queries and delivering predictions via microservices and API gateway
  - vendors:
    [Vespa](https://vespa.ai),
    [Baseten](https://www.baseten.co),
    [OctoML](https://octoml.ai),
    [Kubernetes](https://kubernetes.io),
    [Kong](https://konghq.com)

- Orchestration (Middle Layer II):
  - Manages prompt routing, model chaining, agent reasoning, and complex decision pipelines for multi-model solutions.
  - Platforms:
    [Kubeflow](https://www.kubeflow.org),
    [LangChain](https://www.langchain.com),
    [Haystack](https://haystack.deepset.ai),
    [Run.ai](https://www.run.ai),
    [MLflow](https://mlflow.org),
    [Monte Carlo](https://www.montecarlodata.com)

- Tooling (Upper Layer):
  - Provides environments for developers to build, test, deploy, and scale AI applications (developer environments, agent builders, data visualization, automation, cost optimization).
  - vendors:
    [Deepnote](https://deepnote.com),
    [Flyte](https://flyte.org),
    [Crew.ai](https://www.crew.ai),
    [Zapier](https://zapier.com)

- Application Layer (Top Layer):
  - User-facing, custom, in-house AI-powered applications. This could be something like a web interface or desktop app.

- Security & Governance (Cross-Layer):
  - Horizontal layer spanning all others, focusing on security, privacy, compliance, and trust (risk mitigation, data masking, lineage tracking, adversarial testing, governance frameworks).
  - vendors:
    [HiddenLayer](https://hiddenlayer.com),
    [Lakera](https://lakera.ai),
    [Skyflow](https://skyflow.com),
    [Trustible](https://trustible.ai),
    [DataRobot](https://www.datarobot.com)

## USE CASE: MODULAR AI

---

This particular use case comes from [Modular AI](https://www.modular.com/)—a company that has decided the only sensible response to modern AI complexity is to rebuild the entire stack from the ground up. Their approach is squarely in the on-prem, modular-culture camp: give engineers control over every layer, from the lowest kernel-level optimizations all the way up to distributed orchestration. In theory (and increasingly in practice), this means you can write hardware-agnostic GPU kernels in [Mojo](https://www.modular.com/mojo)—Modular’s Python-adjacent, performance-obsessed language—if you feel inclined to chase compile-time efficiency rather than accepting whatever the default [CUDA](https://en.wikipedia.org/wiki/CUDA) pipeline gives you.

The Modular Platform itself is an open, fully integrated suite of AI libraries and tools designed to accelerate model serving and scale Generative AI deployments without surrendering control to a managed service. The architecture is vertically integrated: hardware at the bottom, Kubernetes at the top, with a series of entry points along the way depending on how deep you want to dive. It’s the kind of system that rewards engineers who like understanding (or rewriting) the machinery instead of treating it as a polite abstraction.  

### MODULAR FRAMEWORK COMPONENTS

---

- **[MAX](https://www.modular.com/max)** (Modular AI Engine) is Modular AI’s high-performance AI serving framework, the sort of thing that makes you realize serving LLMs at scale isn’t just about throwing GPUs at a problem. It comes with advanced optimizations like speculative decoding and graph compiler tricks, and offers an OpenAI-compatible endpoint, making integration with existing tooling almost trivial. MAX executes both native MAX models and PyTorch models across GPUs and CPUs, all without actually requiring CUDA—just the NVIDIA drivers—which keeps the Docker container absurdly lean (under 1.3 GB compressed). Multi-GPU configurations are supported, as are more than 500 GenAI models, with advanced quantization that can, for example, compress LLaMA 3.1 70B from 140 GB down to 35 GB using [INT4 GPTQ](https://huggingface.co/docs/transformers/en/quantization/gptq). In other words, MAX is the sort of system that makes massive models feel like a manageable engineering problem rather than a hardware apocalypse.

- **[Mojo](https://www.modular.com/mojo):** This is where Modular starts wrestling with full-stack kernel-level customization. Mojo combines Pythonic syntax with the performance of C/C++ and the safety principles of Rust, designed from the ground up for [MLIR](https://mlir.llvm.org/) (Multi-Level Intermediate Representation). That means you can write high-performance GPU and CPU code while retaining low-level control across hardware types—even those without CUDA. Paired with MAX’s graph-level optimizations, Mojo becomes a security tool as much as a performance tool: you could implement custom cryptographic kernels or specialized data-sanitization routines directly into the inference path. Every layer is visible, modifiable, and auditable—precisely the sort of control that environments with strict classification requirements drool over.

- **[Mammoth](https://www.modular.com/mammoth):** Formerly MAX Inference Cluster, Mammoth is the Kubernetes-native control plane, routing substrate, and orchestration layer that makes distributed AI serving tolerable. It handles multi-model management, prefill-aware routing, and disaggregated compute and cache. In practice, it means workloads are automatically routed to the “best” hardware for the job, throughput is maximized, latency minimized, and the system generally behaves like a conscientious air traffic controller rather than a chaotic dispatcher.

## ON-PREM INFRA

This architecture targets medium-to-large enterprises that want serious, on-prem AI without surrendering control. It’s built for both training and inference workloads, with an eye toward modularity so future expansions—whether Generative AI experiments or RAG pipelines—don’t require tearing the whole system down. The emphasis on fully on-prem hardware isn’t just for show: it’s about self-reliance, predictable performance, and keeping sensitive data entirely within the organizational perimeter. (Think of it as trading the convenience of cloud elasticity for a kind of sovereignty that is surprisingly rare in modern AI deployments.)

### CPUs

---

While GPUs are the primary accelerators for AI workloads, CPUs are also needed for data preprocessing, orchestration, and overall system management. They feed data to GPUs and handle non-GPU-accelerated tasks. The obvious choice is a multi core type chip. Specifically, processors like the Intel® Xeon® Platinum 8480C, which offer 16 or more physical cores and support hyper-threading, are ideal for efficient task management, particularly in multi-user or virtualized environments.

**CPU Specs:**

- CPU: Dual Intel Xeon Gold 6444Y (32 cores/64 threads each) or AMD EPYC 9374F (32 cores/64 threads each).
- RAM: 512GB DDR5 ECC RAM (e.g., 16 x 32GB modules) per server.

### GPUs

---

In the context of a stack using the Modular AI Platform, there are [three tiers](https://docs.modular.com/max/packages/#gpu-compatibility) for GPU support:

1. Tier 1: Fully supported GPUs that are optimal for production for the [Hopper](https://www.nvidia.com/en-us/data-center/technologies/hopper-architecture/), [Ampere](https://www.nvidia.com/en-us/data-center/ampere-architecture/), and [Ada Lovelace](https://www.nvidia.com/en-us/geforce/ada-lovelace-architecture/) architectures from NVIDIA and the [CDNA3 AMD](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-3-white-paper.pdf) architecture.

2. Tier 2: Confirmed capacity for GPUs involved in less critical workloads and testing, which includes NVIDIA RTX 40XX series (Ada Lovelace) and NVIDIA RTX 30XX series (Ampere).

3. Tier 3: There is limited compatibility of the Modular AI system with this tier of GPUs which may not run some newer GenAI models. This includes anything from the Turing, Ampere, RDNA4, and RDNA3 architectures.

Tier 1 GPUs—H100, A100, L40/L40S, MI300X/MI325X—are where Modular focuses most of its optimization and testing energy. This is not arbitrary: the stack is tuned end-to-end for these devices, which is why performance claims actually hold up under real workloads. You can use Tier 2 or 3 GPUs—they’re compatible enough to work—but expect to pay in either throughput, feature support, or the ability to run the full roster of GenAI models. (In other words, performance and reliability are a careful negotiation with silicon; picking the wrong tier is like trying to run a high-end engine on diesel meant for a lawnmower.)

Cluster Specs:

- For Training: DGX H100 mini cluster: 8 NVIDIA H100 @ 640GB total memory
- For Inference: NVIDIA L40S cluster 48GB/GPU (for balanced performance/cost)

### MEMORY

---

For this use case, the middle-ground architecture settles on [NVIDIA L40S GPUs](https://www.nvidia.com/en-us/data-center/l40s/) with 48GB of GDDR6 RAM—a choice that balances performance and cost. It’s tuned for AI inference, training, enterprise-scale deployments, and RAG workloads, without hitting the sticker shock of an H100-based setup. The initial system should comfortably handle inference compute for a few hundred employees—enough to act as a practical testbed without overcommitting hardware. If you scale up using L40S, equipping the system with 256–512 GB of [ECC RAM](https://en.wikipedia.org/wiki/ECC_memory) provides sufficient VRAM for multiple concurrent model inferences, plus the headroom to run embedding models, re-rankers, and serve the LLM itself. (In other words, you get a sandbox large enough to experiment seriously, without requiring a data center-sized budget.)

### STORAGE

---

Storage is not merely a passive data repository but an active, performance-critical component for supporting AI compute. The primary objective is to prevent data bottlenecks from starving the GPUs so that data is delivered to the compute units with minimal latency and maximum throughput. This requires an upgrade from traditional storage systems to systems that provide high-speed read/write and parallel access, which affects the efficiency of the AI system. Distributed and scalable storage should be treated as an extension of the compute layer to maximize GPU utilization and overall AI pipeline performance.

Distributed Storage:

- Dell PowerScale:
  - highly flexible scale-out NAS which provides storage architecture that consolidates file, block, and object services. It delivers high performance and low latency which meets NVIDIA's DGX platform requirements (in GPU specs above) and integrates with Kubernetes environments. The system uses QLC SSDs for high capacity and PA110 Accelerator Nodes to mitigate CPU bottlenecks.

Examples in the wild:

- [DDN](https://www.ddn.com/) + NVIDIA [BlueField‑3](https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/documents/datasheet-nvidia-bluefield-3-dpu.pdf): DDN integrated BlueField-3 DPUs into its storage appliances.
- [CoreWeave](https://www.coreweave.com/products/storage#local-storage) + [VAST](https://www.vastdata.com/platform/overview) + BlueField: CoreWeave’s AI object storage uses BlueField DPUs for control-plane

### NETWORKING

---

A stable, high-speed external network connection—1 Gbps or higher—is basically non-negotiable for on-prem AI deployments. You need it to pull down large datasets, push model updates, and enable either remote collaboration or API-driven inference requests. On a Modular AI stack, particularly in multi-GPU configurations, bandwidth becomes even more critical: supporting medium to large-scale LLMs requires not just enough network for general I/O, but the kind of throughput that keeps GPUs fed and prevents idle cycles. This involves both inter-GPU communication and connectivity across the cluster. On the hardware side, NVIDIA [NVLink](https://www.nvidia.com/en-us/products/workstations/nvlink-bridges/) provides ultra-high-speed GPU-to-GPU lanes—H100 GPUs push 600 GB/s, and a[DGX H100](https://www.nvidia.com/en-sg/data-center/dgx-h100/) system can deliver 900 GB/s bidirectional, scaling up to 256 GPUs with NVLink Switch. PCIe Gen5 ensures fast GPU-to-CPU communication at 128 GB/s, while high-speed Ethernet or InfiniBand, such as NVIDIA [ConnectX-7 VPI](https://www.nvidia.com/en-us/networking/infiniband-adapters/), can deliver up to 400 Gb/s per link for inter-node communication, contributing to a peak bidirectional throughput of around 1 TB/s in DGX H100 clusters. (In practice, this means the network stops being a bottleneck, and the GPUs can actually spend their cycles doing inference rather than waiting for data to trickle in.)

### SOFTWARE

---

#### Containerization

This layer defines the foundational software components that underpin both Kubernetes orchestration and the Modular AI deployment. In practice, Ubuntu 22.04 LTS is the recommended choice, particularly in enterprise settings, because Modular’s development and testing are heavily concentrated on this version. (If you stray from it, you are effectively venturing into a lightly mapped wilderness.) Reference to Modular’s [official documentation on base operating systems](https://docs.modular.com/max/packages#system-requirements) is not optional; it’s where all the subtle compatibility decisions are documented.

Installing Kubernetes on a default Ubuntu install is almost guaranteed to introduce instability—this is not a bug, it’s a predictable consequence of container runtimes and kernel configurations. Specific alignment steps are required for Containerd, including careful version verification, otherwise deployment failures are likely. Kubernetes depends on a runtime it can control, and using the wrong Containerd version is like handing the conductor a baton made of rubber: the orchestra may continue, but it won’t be music.

Running the MAX container itself also has prerequisites: the official Docker image provides the complete toolset for local development, testing, and container management outside of Kubernetes. Docker Engine should be part of the base OS setup, not merely tacked on as a Kubernetes requirement—treat it as foundational plumbing rather than optional scaffolding. (In other words, skip it at your own peril; MAX doesn’t forgive half-hearted setups.)

#### Orchestration

This layer dives into the Kubernetes setup, which acts as the orchestration backbone for deploying and managing Modular AI inference services. A GPU-enabled Kubernetes cluster is essentially non-negotiable if you want to run MAX and actually leverage GPU acceleration. On Ubuntu 22.04 LTS—the recommended base OS—Kubernetes is officially supported, actively maintained, and tightly integrated. This isn’t just bureaucratic convenience: it’s the difference between a system that survives upgrades and patches versus one that feels like juggling chainsaws while blindfolded. Using Ubuntu 22.04 LTS gives an enterprise-ready path for on-prem deployments, removing a lot of the friction that comes from cobbling together a cluster from generic components.

[Helm](https://helm.sh/) serves as the primary package manager here, and Modular relies on it to deploy MAX containers. Helm is more than a convenience—it enables templated deployments, versioned applications, and orchestrated resource management. Its multi-stage deployment process—pulling MAX containers, downloading model weights, configuring endpoints—effectively automates the entire model-serving setup. (Engineers are freed from the tedium of endless [kubectl](https://kubernetes.io/docs/reference/kubectl/) commands and can operate declaratively, which is both more reproducible and less likely to make a cluster cry.)

The final critical piece is the [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-container-toolkit) (formerly nvidia-docker 2). Without it, Docker containers or Kubernetes pods would be blind to the GPUs beneath them. This toolkit exposes the necessary drivers and CUDA libraries to containers, letting them actually use GPU hardware efficiently. Installation happens at the OS level, allowing [Containerd](https://github.com/containerd/containerd) to orchestrate GPU access for pods scheduled on GPU-enabled nodes. This is the plumbing that makes GPU acceleration work inside a containerized environment—and without it, MAX on Kubernetes simply doesn’t fly. (Treat it as foundational rather than optional; skipping it is basically signing up for a week of frustration.)

Software stack:

- OS: Ubuntu 22.04 LTS ([Jammy Jellyfish](https://releases.ubuntu.com/jammy/))
  - Preferred for stability and compatibility with Modular stack and AI frameworks
- Python: 3.9 - 3.13 (Prefer 3.11-3.12 for general compatibility)
  - Required for Mojo SDK and MAX Python APIs.
- Compiler: [g++](https://gcc.gnu.org/) or [clang++](https://clang.llvm.org/)
  - Required for Mojo compilation
- Container Runtime: containerd 1.6.x (specifically containerd.io from Docker repo)
  - Critical for Kubernetes 1.26+ compatibility on Ubuntu 22.04 LTS.
- Docker Engine: Latest stable (e.g., Docker Engine 27.x, Docker Compose v2.x)
  - Install from official Docker repository for latest versions and containerd.io dependency
- Kubernetes: Canonical Kubernetes 1.32.x (or latest N-2 supported LTS)
  - GPU-enabled cluster required; consider Charmed Kubernetes or MicroK8s for Ubuntu integration.
- Helm: Latest stable (e.g., Helm 3.18.x)
  - Essential for deploying MAX containers and managing Kubernetes applications.
- NVIDIA GPU Driver: 550 or higher
  - required for NVIDIA GPU acceleration

### DEVELOPMENT LAYER

---

This layer walks through the practical steps of getting Modular’s MAX AI engine up and running inside Kubernetes, and hooking it into models and your MLOps workflow. Think of it less as a rigid checklist and more as a guided tour through the plumbing that makes LLMs actually work on-prem.

#### Max Container Deployment

MAX is Modular’s [official Docker container](https://docs.modular.com/max/container) for running GenAI models. It comes with a compatible endpoint for LLMs, so you can actually interact with the models without building a bunch of glue code. Deployment on Kubernetes is handled via Helm (as mentioned above), which basically turns what would otherwise be a fiddly, error-prone process into something declarative and repeatable.

Step one: create a dedicated Kubernetes namespace—something like `max-ollama-demo`—to keep your MAX deployment isolated from the rest of the cluster. Isolation here isn’t just “nice to have”; it keeps resources from bleeding into other workloads and makes debugging way easier.

Then comes the Helm deployment: first, pull the MAX container image from Docker Hub (which might include a default model like LLaMA). Next, download the specific model weights you actually care about—say, [LLaMA 3.1 GGUF](https://huggingface.co/unsloth/Llama-3.1-8B-Instruct-GGUF)—and finally, configure and launch the model so it’s exposed as an endpoint on whatever port you choose (8000, for example). At this point, you’ve turned a raw container into a live, queryable LLM running on your own hardware—essentially the first step toward fully operational on-prem GenAI.

The `docker run` command for MAX containers typically includes volume mounts for:

- model caches:`~/.cache/huggingface`
- port mappings: `8000:8000`
- device mappings for GPU access: `--device /dev/kfd`, `--device /dev/dri` for AMD, or `--gpus=1` for NVIDIA.

There are some options for the max serve command (which the container wraps):

- `--model-path` (required to specify the model)
- `--max-length` (for adjusting sequence length based on memory constraints).

Various MAX container options can be used to cater to different GPU setups and dependency requirements:

- max-full
- max-amd
- max-nvidia-full
- max-nvidia-base

### MODEL SERVING

---

MAX can handle a surprising variety of AI model formats: [PyTorch](https://pytorch.org/) (TorchScript), [ONNX](https://onnx.ai/onnx/intro/concepts.html), and [native Mojo models](https://github.com/mojicians/awesome-mojo) all play nicely. For Mojo models in particular, MAX isn’t just a runtime—it acts as both compiler and execution engine. Behind the scenes, it builds and verifies the model’s computational graph, spins up an inference session, compiles the graph, and then executes it whenever you feed it inputs. It’s the kind of process that, if you’ve ever done it by hand, makes you appreciate the value of automation.

On Modular’s platform, you can export Mojo models, but the main workflow is usually through the [max.graph](https://docs.modular.com/max/develop/get-started-with-max-graph-in-python/) API in MAX’s hosted environment. Here, your model gets compiled into a graph ready for execution. MAX caches these compiled graphs, so if you run another model with a similar structure, it can skip the compilation step entirely—speeding up iteration and letting you treat model deployment more like “plug-and-play” than “reinvent the compiler every time.”

MAX also comes pre-equipped to serve a wide range of pre-trained Generative AI models. Text models like LLaMA, Mistral, and Qwen. Audio models like [Whisper](https://github.com/openai/whisper). Video models such as [Wan](https://github.com/Wan-Video/Wan2.1), [LTX](https://huggingface.co/Lightricks/LTX-Video), and [Open-Sora](https://huggingface.co/hpcai-tech/Open-Sora-v2). Image models, including [Stable Diffusion](https://stability.ai/stable-image). These can all be pointed to with the `--model-path` option when you spin up the MAX container. (In practice, this makes MAX less a single-purpose runtime and more like a universal inference engine for whatever GenAI workload you care to throw at it.)

### ML OPS

---

#### Experiment Tracking and MLflow

MLflow is basically the Swiss Army knife for the ML lifecycle. Run it on Kubernetes, and it suddenly gains the kind of scalability, reliability, and GPU support that makes it enterprise-usable. You’ll want persistent storage (PVs/PVCs) for experiments and models, expose the UI through a Kubernetes Service, and deploy models either via a FastAPI inference server in Docker—or, if you want something production-grade, through [MLServer](https://github.com/SeldonIO/MLServer) into [KServe](https://github.com/kserve/kserve) or [Seldon Core](https://github.com/SeldonIO/seldon-core). (The distinction matters: one is “good enough to experiment,” the other is “good enough to survive a CEO demo.”)

#### Monitoring

Watching AI inference in Kubernetes isn’t optional; you need to know usage, latency, and errors in real time. The standard stack is [Prometheus](https://github.com/prometheus/prometheus) for metrics collection plus [Grafana](https://github.com/grafana/grafana) for dashboards, usually deployed together via the *kube-prometheus-stack* Helm chart. Prometheus scrapes metrics from exporters and lets you query them with PromQL, while Grafana gives you live, glanceable dashboards. If you’re feeling fancy—or running multiple clusters—you can externalize Prometheus, use remote write, or even hook up [Thanos](https://github.com/adavarski/kind-multicluster-thanos-prometheus-grafana-playground) for multi-cluster queries. But for most deployments, running Prometheus inside the cluster is simpler, faster, and less headache-prone. (Metrics are useless if the collector itself keeps dying.)

## MODULAR CONSIDERATIONS

---

*Implicit above, but worth calling out explicitly:*

- Scalability: Horizontal scaling should be baked into every layer. Kubernetes and distributed storage make this tractable, but you still need to plan ahead.

- Modularity: Each component should be independent, talking through clean APIs. Swap out a model, storage backend, or inference engine without collapsing the stack.
- Automation: Infrastructure as Code (Terraform, Ansible) plus CI/CD pipelines are not optional; you want reproducible deployments, not hand-crafted snowflakes.
- Monitoring & Logging: Observability is non-negotiable. Bottlenecks, performance hiccups, and security threats won’t announce themselves politely.
- Security by Design: Network segmentation, access control, encryption at rest and in transit—treat these as first-class citizens. Regular audits aren’t bureaucratic—they’re survival.
- High Availability & Disaster Recovery: Redundancy everywhere: power, network, compute, storage, control planes. Test DR plans before something actually goes wrong.
- Cost Optimization: Performance is great, but consider power, cooling, and total cost of ownership. Open-source tools help reduce licensing overhead without sacrificing capability.
- Skillset: You need a solid team across MLOps, DevOps, and networking. This isn’t plug-and-play; complexity scales faster than most org charts.
- Taken together, this architecture offers a detailed blueprint for a modular, on-prem AI stack capable of handling demanding AI workloads. (In practice, it’s as close as you get to designing your own mini-AI data center without building a literal one from scratch.)

## THE API WAY

### The CASE FOR LLM APIs

---

It's important to take into consideration that most institutions don't have the infrastructure to run large language models in-house, and standing up that kind of compute would be extremely expensive and time-consuming. Using an API-based approach is a fast, scalable alternative. A good example is building an internal knowledge assistant using Retrieval-Augmented Generation (RAG). Instead of forcing employees to dig through SharePoint, Confluence, or PDFs, they can ask questions in plain English and get accurate answers pulled from internal docs like HR policies, SOPs, or engineering wikis. The system works by chunking and indexing documents into a vector database, retrieving the most relevant pieces for a given query, and passing those to the LLM via API to generate a contextual response.

The benefit of an API call to an LLM is that users get access to cutting-edge models from providers like OpenAI or Anthropic without managing updates or compatibility issues. Going the API route means you don’t need to manage GPUs or scale infrastructure to support test-time compute.

From a security perspective, this setup has the potential to keep sensitive information in-house, where the LLM only sees the specific document snippets needed to answer a question. Security-wise, the organization can apply filters or redactions before data is sent, keeping tighter control over what leaves your environment. Overall, this approach gives teams the ability to move quickly, build powerful tools, and serve all employees without a massive infrastructure lift.

An API approach gives the organization the ability to plug external SOTA LLMs into an on-prem environment using an API, with a custom web application sitting on top. The goal is to keep sensitive data and core logic in-house for security, performance, and control. It’s designed to take advantage of the power of modern LLMs without sending private data outside to third-party providers. The architecture covers everything from the front-end app to the backend hardware, focusing on secure data flow, solid orchestration, and making sure everything stays compliant.

## API USE CASE

---

### SOTA LLM VIA API WITH RAG

---

#### Custom App Layer

Think of this as the “user-facing skin” of the whole system—the part your colleagues actually see, click, or complain about. It lives entirely inside the organization’s perimeter: no SaaS tentacles reaching in, no browser extensions quietly phoning home, just a local stack serving local users.

The app itself can be anything: a web frontend (React, Angular, Vue), a desktop wrapper (Electron, native), or an integration quietly wedged inside an existing enterprise tool. Its job is mostly unglamorous but essential: take the user’s question, sanity-check it, shove it toward the internal API gateway, and turn the response into something someone can actually read. No external network calls, no leaked tokens—just a clean conduit from user → internal gateway → eventual model.

It only ever talks to the on-prem API Gateway/LLM Proxy, and that communication is locked down with authenticated HTTPS or [mTLS](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/). The frontend never gets to “just hit the OpenAI API directly,” because that’s how you end up with API keys floating through browser logs and your boss calling you at 2 AM.

#### API Gateway / LLM Proxy Layer

Here’s the real nerve center of the architecture. Every interaction with an external LLM—OpenAI, Anthropic, whatever frontier model you’re using this month—flows through a single, heavily regulated chokepoint. If the external LLM is the wild, radioactive outside world, this layer is your lead-lined bunker door.

It enforces policy sanity. It decides who is allowed to ask what, to which model, and with what data. API keys sit in its encrypted vault rather than your application logs. It rate-limits the overeager analysts who think “just one 200k-context call” doesn’t count. It balances traffic across providers and regions. If one endpoint goes down, it quietly fails over to the next. It sanitizes inputs for prompt-injection, redacts sensitive bits on the way out, and logs everything—token counts, timing, errors, user IDs, project metadata—so you can track costs and compliance without searching through six different dashboards.

It can even cache repeated prompts or batch tiny requests into larger ones to trim costs. Feature flags let you toggle providers or test new model versions without launching a full migration. In practice, it’s the difference between “our app works reliably” and “our app sometimes vanishes into a black hole when OpenAI hiccups.”

Under the hood:

- API Gateway software: [Kong AI Gateway](https://konghq.com/products/kong-ai-gateway), [APISIX](https://apisix.apache.org/), [Envoy](https://gateway.envoyproxy.io/). Run them on Kubernetes so they scale and don’t melt during peak usage.
- Custom Plugins: The logic that makes this whole thing “your gateway” instead of “NGINX with extra steps.”

What it enforces:

- Authentication & Authorization (OAuth, OIDC, RBAC/ABAC, zero trust).
- Secure API key handling for external LLMs.
- Load-balancing, rate-limiting, failover.
- Hard boundaries on who can do what with which model.

Proxy Layer Security:

The gateway’s security layer intercepts every interaction and scrubs it until it’s clean enough to survive a compliance audit.

Before any prompt leaves your perimeter, it runs through PII redaction—names, emails, credit-card numbers, employee IDs, whatever counts as “things we’d rather not be sued over.” You can apply the same treatment in reverse if you want to sanitize outputs before they hit the user. Content filters block toxic or policy-violating material, and strict prompt guardrails compare every request against your organization’s rules.

On the output side, encoding/escaping/validation try to prevent model-generated injection attacks (yes, that’s a real thing), and secrets-detection scanners hunt down hallucinated API keys or credentials. If the model tries to “helpfully” produce a working token, the gateway will catch it and redact it.

Everything moves through [TLS (AES-256)](https://www.kiteworks.com/risk-compliance-glossary/aes-256-encryption/), and the observability layer logs every input, output, API call, sanitization event, and weird spikes in latency. You can plug this into ELK or Splunk for [SIEM](https://en.wikipedia.org/wiki/Security_information_and_event_management)-grade auditing, or feed it into Grafana for real-time token usage, throughput, and error-rate dashboards. From an ops perspective, it becomes your flight recorder and your black box.

#### LLM API Layer + RAG

Using a RAG system as an example, LLMs can be called through an API where the layer serves as the interface between the internal retrieval pipeline and the external hosted model. Once the relevant documents are retrieved, this layer packages the user's query and the retrieved context into a structured prompt and sends it to the external LLM provider via secure API calls. It handles request formatting, authentication, rate limiting, batching, and error handling for reliable communication. On the response side, it parses the LLM output, applies any post-processing (such as filtering, re-ranking, or enforcing structured outputs), and then passes the result back into the system for consumption by downstream applications. This layer can enforce security and privacy boundaries by ensuring only non-sensitive or pre-approved data is sent out, often working in tandem with the RAG layer to ground the model’s output in the internal knowledgebase without exposing proprietary datasets directly to the external API. Other applications like chatbots can use the same functionality stated above.

## RAG SYSTEM OVERVIEW

---

A Retrieval-Augmented Generation (RAG) system is basically the LLM equivalent of giving your model a cheat sheet—but one that’s generated on-the-fly from your own internal knowledge base rather than scraped from the open internet. Its whole reason for existing is simple: users want fast, accurate answers tied directly to internal documents, policies, reports, emails, architecture diagrams, whatever—and you want to give them that without flinging your proprietary data out into some external LLM’s training logs.

The RAG layer sits right between your app and the raw model and says: “Tell me what you’re looking for, and I’ll pull the exact passages you need, but I’m not letting any of these documents leave the building.”

The pipeline starts by ingesting your internal documents like PDFs, markdown files, emails, SQL dumps, SharePoint relics, normalizing them into something usable. It chunks the text into pieces, cleans up weird formatting, generates embeddings for each chunk, and stores them in an on-prem vector index. This index becomes the long-term memory the LLM never had.

When a user fires off a query, the RAG layer runs a semantic search over that index, grabs the top-K passages that actually matter, and assembles them into a context pack that gets injected into the prompt. Along the way, it handles all the janitorial tasks that people forget about: deduplicating near-identical snippets, enforcing snippet-size caps so you don’t blow your token budget, pruning stale content, and boosting domain-relevant sections (e.g., giving regulatory text or engineering specs more weight than random chatter).

Before the enriched prompt goes anywhere near the LLM, the system can redact leftover metadata, stitch in standardized system prompts, and adjust formatting so every query looks like it came from someone who knows what they’re doing. It also acts as your token accountant, making sure you don’t run a 40-page prompt into a model with a 32k context window and then wonder why it crashed.

After the model produces its answer, the RAG layer can turn into a skeptical editor: fact-checking the response back against the vector index, flagging hallucinations, smoothing out inconsistencies, or pulling in additional context if the model glossed over something important. Only after that does it hand the final, grounded response back to the user.

So, this system acts as the tether between the model’s generative fluency and the organization’s actual source of truth, all while keeping the whole operation inside your own walls, behind your firewall, and under your control.

### COMPONENTS

---

- **Data Ingestion Pipelines:** Think of this as the part of the system that goes rummaging through every corner of your internal universe—databases, file shares, random APIs someone wrote in 2017 and never documented—and tries to make sense of it all. Some of that data arrives as a steady stream of events (Kafka is great here), and some comes in big lumbering batches (Spark, inevitably). The ingestion layer’s job is basically to get everything into one coherent flow without losing anything or falling over.

- **Data Processing & Feature Engineering**: Once the data shows up, it’s usually a mess. So the system cleans up missing values, normalizes formats, encodes things the model can actually understand. Document-wise, you pull text out of whatever bizarre format it lived in—PDFs, TIFF scans, the occasional photo of whiteboard scribbles—using OCR and whatever extraction tools work when encountering a slightly rotated page. Then comes chunking and embedding: splitting large documents into bite-sized, semantically sensible sections, and converting those into vectors using an internal embedding model. If the dataset is huge, you offload this to Spark, Ray, Dask, or anything else that can handle the load size.

- **Knowledge Base / Vector Database:** This is the part of the stack where your transformed data actually lives. The vector store, whether it’s Qdrant, Chroma, Weaviate, or even a self-hosted Pinecone, holds the embeddings and makes similarity search cheap and fast.
If you’re storing the underlying raw/processed data too, it lives in a lakehouse layer using Delta Lake, Iceberg, or Hudi sitting on top of a blob store like MinIO. ACID transactions help keep everything from collapsing into metaphysical uncertainty.
A feature store (like Feast) can slot in if you’re generating structured features and want the training/inference sides of the house to stop arguing about whose version of “customer_age” is correct.

- **Retrieval & Orchestration Logic:** This layer is where queries from users get turned into something the system can reason about. A query gets embedded, the vector DB returns the top-k likely suspects, and a retrieval/orchestration framework—usually LangChain or LlamaIndex—glues it all together into a context bundle.
Hybrid search, re-rankers, truncation strategies, and prompt templating happen here. It’s also where you do the boring-but-critical things like caching, deduping repeated chunks, and avoiding the “why is this PDF header showing up in every answer” effect.
On the orchestration side, this layer prepares the final augmented prompt that the model will see, handles token budgeting, and makes sure context doesn’t blow past model limits just because someone uploaded a 600-page manual.

- **Generation (LLM):** This is the shiny part everyone likes talking about. Once the context-loaded prompt is ready, it gets handed off to the LLM (GPT, LLaMA, Mistral). The model produces an answer that should feel grounded, coherent, and tied to reality thanks to the upstream retrieval work. If the application supports it, the prompt can hint the model toward chain-of-thought or “reasoning mode,” but the retrieval layer is what really keeps it anchored.

- **Post-Processing:** After the model fires off its answer, the system gives it a quick sanity check. Maybe revalidate a few facts, clean up phrasing, redact any sensitive tidbits the LLM decided to hallucinate into existence, and shape the final output for whatever interface consumes it like chat frontends, dashboards, APIs, etc.

- **Feedback & Monitoring:** RAG systems need tuning, so you track how well they’re doing: latency, retrieval accuracy, hallucination rate, drift, all the usual suspects. User feedback (the humble thumbs up/down icon) is surprisingly helpful for spotting patterns. Over time, this loop informs better chunking, better indexing, better prompts, and fewer support tickets from confused users.

> [!info] Notes on compute needs for a RAG system:
>
> To setup a RAG pipeline, a massive on-prem setup is not required to do much heavy lifting to complete an API call to a frontier model. For example, using OpenAI's Embedding + Completion API:
>
> - Vector store and retrieval tasks require enough RAM to hold a dense vector in memory. It's calculated as this: ```RAM (bytes) ≈ #docs × vector-dim × 8```
> - If an organization has 1M documents, each embedded to 1,536 dims (OpenAI embedding size), it looks like: ```1,000,000 × 1,536 × 8 ≈ 12.3GB```
>
> In practice, it's best to have a bit more memory to include the OS, app layer, Python, etc. So a 16-32 GB machine should be able to handle a 1M-vector FAISS or Annoy index. CPU processing requirements for vector lookups are parallel; even a modest 4-8 vCPU box can serve hundreds of queries/sec with minimal latency. If the embeddings are offloaded to an embedding API, there is no need for a local GPU. A standard python environment on the same 8 vCPU/16GB box will chunk, call out to the API, write vectors into the store can complete a few hundred records per second.
>
> There is an option to run model embeddings on-prem with minimal hardware implementation (in comparison to a fully on prem LLM system). This route keeps sensitive text (customer records, proprietary docs) entirely in-house, and after the upfront investment in hardware, per-embedding cost could drop to zero versus the pay-per-call method. This also eliminates round-trip API calls, which addresses any latency issues.
>
> The orchestration piece of the RAG system is trivial compute-wise, around 2-4 GB of RAM and a 1-2 vCPU for a normal amount of parallelism. The orchestration path (e.g., python app) looks like this:
>
> - chunk → embed → upsert → retrieve → call completion → assemble answer → return
>
> So, basically, the organization can scale up RAM/CPU linearly with the current document set and query volume, but since a giant transformer is not running locally, just a vector DB and some Python glue will suffice.

### RAG STRATEGIES

---

#### Indexing and search

At the bottom of it all, retrieval is just the art of asking: given this question, what’s probably relevant?
If the corpus is small enough, exact search works fine; otherwise you graduate to the usual approximate nearest neighbor (ANN) methods. These let you trade a bit of recall for big wins in speed and memory—basically the difference between flipping through a few folders and spelunking an entire library.

Most vector DBs now do “hybrid search” out of the box: semantic vectors for meaning, keyword search for precision, plus metadata filters (timestamps, author, doc type) so you don’t accidentally dredge up something from 2014 and present it as gospel. This is also where access control lives, so people only see what they’re allowed to see.

#### Re-ranking and retrieval

The first retrieval pass is usually a bit noisy by design—cheap and broad. After that you clean it up. A neural re-ranker (often a cross-encoder) goes through the top candidates and reorders them based on actual relevance instead of raw vector proximity. This two-stage pipeline makes retrieval both fast and accurate.

You can also let the LLM rewrite the user’s query into something more index-friendly. Humans ask weird, elliptical questions; the model can generate a cleaner version that actually hits the right documents.

#### Embedding model

Embeddings are the “vocabulary” the rest of the system uses to understand your data, so the model that produces them matters. Generic embeddings from OpenAI, Cohere, or sentence-transformers are fine for broad use cases, but niche domains (medicine, law, finance) often benefit from in-house or fine-tuned models.

High-dimensional embeddings carry more nuance, but cost more to store and search. Low-dimensional ones are faster but less expressive. You want the Goldilocks zone. And always version them—the day you upgrade your embedding model without tagging the old vectors is the day indexing becomes un-debuggable.

Cosine normalization (`L2`) is nearly always a good idea, though it does compress some detail; it’s the cost of playing nicely with similarity metrics.

#### Prompt construction and context management

Once you’ve retrieved your candidate chunks, they need to be fed into the LLM. This is where the prompt becomes a kind of scrapbook: pick the 3–8 most useful passages, trim or summarize the extra-long ones, and respect the model’s context window. When in doubt, hierarchical retrieval plus summarization usually beats “just cram everything in.”

Prompt templates matter more than people expect. You want to gently—but firmly—remind the model to use the retrieved context, cite where its info came from, and confess ignorance instead of hallucinating like a caffeinated fiction writer.

#### Generation and Grounding Safeguards

Hallucinations happen when the LLM runs out of guardrails. You can fight this by making grounding explicit: “Use only the provided context,” “Cite the passage you’re referencing,” “If you can’t find it, say so.”

Some systems even run a post-hoc verification step: compare the model’s claims to the retrieved documents and downgrade or flag anything not supported by evidence. It’s surprisingly effective—like a sanity-checking friend who skims your work before you hit “send.”

#### Dialog and Session State

In real life, users don’t ask questions in isolation—they ask follow-ups, clarifications, half-finished thoughts. So a good RAG system tracks conversational context. Temporary memory holds the running dialog; long-term memory can store user preferences or persistent facts (with tighter privacy controls). These memory layers typically live outside the main vector store to keep things clean and auditable.

Observability and Evaluation

A RAG system that can’t be measured can’t be improved. Retrieval metrics like recall@k, precision@k, and MRR tell you whether the system is finding the right stuff. Latency metrics tell you if users will tolerate it. On the qualitative side, hallucination rates and user satisfaction scores fill in the gaps.

Logging the whole retrieval chain—query → embeddings → retrieved docs → final prompt → model output—lets you peek inside the black box. Tools like LangSmith or LlamaIndex tracing make this tolerable rather than a multi-week forensics project.

- top-k: out of all the relevant documents in the dataset, how many did the system retrieve in the top k?

  - `\text{Recall@k} = \frac{\text{# relevant docs in top k}}{\text{total relevant docs in the dataset}}`

- precision@k: out of the k retrieved documents, how many are actually relevant?

  - `\text{Precision@k} = \frac{\text{# relevant docs in top k}}{k}`

This is how you debug a system that’s seemingly “working” but keeps pulling page 17 of the employee handbook for every query.

#### Security, Privacy, and Governance

RAG pipelines often interact with sensitive internal data, so you don’t get to skip the security chapter. Access controls should exist at the vector store and orchestration layers. PII detection before indexing prevents accidents. Deletion workflows must support the “right to be forgotten.”
Metadata filters enforce isolation (“only show this user the documents they actually own”), and audit logs keep track of who asked what—useful for compliance and also for catching suspicious behavior.

#### Operational Concerns

Once people start using the system, scale becomes a problem. Vector DBs may need sharding and replication. Caching saves both time and money. Asynchronous ingestion lets you keep the index fresh without freezing the pipeline. TTLs (time-to-live) decide when stale documents fade away.

For big deployments, distributed clusters and product quantization are your friends—they let you do efficient search without buying a data center.

#### Maintenance and Lifecycle Management

RAG systems age. Models get better, embeddings need regeneration, chunking strategies evolve as you learn what users actually search for. Feedback loops—explicit (“thumbs down”) or implicit (click patterns)—help tune retrieval and re-ranking.

This is not a “deploy once and forget it” situation. It’s more like tending a garden: prune old content, refresh embeddings, revisit templates, and keep an eye out for weeds.

#### Human-in-the-Loop (HITL)

Sometimes the model simply isn’t confident—or shouldn’t be. For edge cases, the system can escalate to a human expert, providing the retrieved docs and the model’s draft answer. These human corrections become powerful training data for better retrievers and re-rankers. Over time, this feedback loop can dramatically improve system quality.

## USE CASE #3: FULLY LOCAL RAG

---

Think of this setup as the same RAG stack you’ve already built: same ingestion, same vector DB, same retrieval logic, but with one big swap. The LLM stops living “somewhere out there on the internet” and moves into your server room. The API layer doesn’t disappear; it just shrinks inward. Instead of an external bridge across the network fence, it becomes a local inference endpoint humming away on your own hardware.

If the org decides to run an open-source model—LLaMA, Mistral, Qwen, whatever the flavor of the month is—you’re essentially promoting the LLM to a resident service on your internal cluster. Prompts no longer take a field trip across the WAN; they stay in your rack, running through GPUs (or, if you’re brave or budget-strained, optimized CPUs) that you control top-to-bottom.

The “API layer” still exists, but now it’s just your in-house model server. vLLM, Hugging Face TGI, Ray Serve—pick your poison. They all do the same core job: accept your RAG-augmented prompt, schedule it, batch it, maybe quantize it, and spit back a completion. In other words, they turn the raw model weights into something your application layer can talk to without burning the building down.

Security becomes refreshingly simple and nothing leaves the perimeter anymore, so PII risk drops dramatically. But the tradeoff is operational weight: you now own everything. You provision the compute. You decide when to update the weights. You debug slowdowns and GPU memory leaks. You monitor throughput, latency spikes, and quantization heuristics. You babysit upgrades and fine-tunes. The convenience tax you used to pay to OpenAI or Anthropic becomes your own internal SRE backlog.

In this architecture, the LLM API layer is no longer a thin proxy to a frontier model, it is the model. A self-hosted inference service sitting right next to your retrieval pipeline, fully under your control and fully your responsibility. Functionally, it behaves the same as the external API; politically and operationally, it’s a whole different beast.

### OSS MODELS FOR RAG

---

*as of Aug 2025*

- DeepSeek-R1

  - MoE, long context, reasoning transparency

- Qwen 2.5-72B-Instruct

  - Instruction-tuned, structured outputs, multilingual, long context

- LLaMA 3.x (e.g., LLaMA 3.1 & 3.3)

  - Scalable sizes, long context, multilingual, safe & instruction-aligned

- Mistral-Large-Instruct-2407

  - Efficient scaling, sparse MoE, strong reasoning & instruction tuning

- Mixtral 8×7B

- DBRX (Databricks Mosaic ML)

  - High benchmarks on coding, math, and reasoning tasks

- Gemma (Google)

  - Lightweight, practical for multilingual/edge RAG needs

- IBM Granite

  - Code-focused, efficient at lower parameter counts

- BLOOM

  - Multilingual and programming language support, open-access

- gpt-oss-120b, gpt-oss-20b

  - Long context (128K), MoE efficiency, tool capabilities, local offline RAG

## OAI OSS

---

In August of 2025, OpenAI dropped their first open-weight language models since GPT-2, which signals a return to an open approach after years of releasing closed-source, proprietary systems. The model was released with open weights and a permissive Apache license. It was optimized for deployment on consumer hardware and "achieves near parity" with o4-mini on most core reasoning benchmarks all while running on a single 80GB GPU. The models come with chain-of-thought reasoning, configurable reasoning levels (Low/Medium/High), and tool-agent capabilities, including web browsing and code execution. GPT-OSS-120b surpasses OpenAI’s o4-mini in reasoning, math, and health benchmarks and 20b matches o3-mini despite its compactness.

Why these models excel in RAG:

- Long Context Windows (e.g., 128K tokens): Crucial for feeding extended documents into the RAG pipeline.

- Instruction Tuning or Reasoning Capability: Enhances LLM ability to follow prompts and ground on retrieved content.

- Multilingual / Structured Output Support: Adds versatility in diverse or international applications.

- Efficiency Optimizations (like MoE or sparse activation): Keeps inference manageable while maintaining performance.

open source embedding models:

- BAAI/bge-base-en-v1.5

  - high performance on semantic search

- intfloat/e5-base-v2

  - for resource constrained environments

- nomic-ai/nomic-embed-text-v1

  - for shirt text apps

- E5 (Microsoft)

- Dewey (InfGrad)

  - long-context document processing
