---
title: HashCode 13.0 | The Innovation Lab
description: A personal account of our time at HashCode 13.0
date: 2025-10-26
cover: "/images/hashcode-stickers.jpeg"
tldr: "Our experience at HashCode 13.0, from start to finish."
draft: false
tags: ["hackathon"]
toc: true
---

---

## The Spark ➤

While exploring the tracks for [HashCode 13.0](https://hashcode.theinnovationlab.in) — 
**More Privacy & Security**, **More Performance**, **More Scalability**, **More Observability**, **More Portability**, and **More Accessibility** —  my team spent a huge chunk of time deciding which one to go with.

Must admit — all tracks were quite interesting unlike many hackathons.

The one I got hooked on was "**More Portability**". It reminded me of an old project I’d built back in my 2nd semester — a **C-based NLP tool** called *[Activity Recommender CLI (ARC)](https://github.com/Sabique-Islam/Activity-Recommender-CLI)*. It used GloVe embeddings to suggest group activities based on user interests.  

The problem was — it only worked on my Mac.  
The moment I tried running it on Windows, everything broke — well of course — because it included some external C headers.

Installing external headers and libraries on Windows is painful — unlike UNIX-based systems, you often have to manually build them from source or rely on tools like MSYS2, set include and linker paths yourself, and hope that it works :)


So I suggested **More Portability** — it felt both personal and practical.  
The team agreed almost instantly. 

And that’s how [**Catalyst**](https://github.com/Sabique-Islam/catalyst) was born.

---

## Getting Shortlisted ➤

We submitted our abstract a few minutes before the deadline (yes, I know 🥀) — with little expectation of getting shortlisted. [HashCode](https://hashcode.theinnovationlab.in/) being more than a decade old **flagship hackathon** of [PIL](https://www.theinnovationlab.in) had a reputation for being competitive with over 150+ submissions.

I'll admit — I have had a bit of a history with hackathon rejections 😭, so I wasn't expecting much this time either.  

I remember just waking up and scrolling through the list of shortlisted teams — not expecting much — and then I spotted *New Folder(1)*, our team’s name among the **top 30 teams**.
Took a few seconds to process it. 

Well that was it, "*we were in*" :)

---

## The Journey Begins ➤

The day finally came — time to go all *“[elves mode](https://www.goodreads.com/quotes/3202966-and-he-could-sleep-if-sleep-it-could-be-called)”*.


All of us are from **PES EC**, but the hackathon was happening at **PES RR** — which meant a little metro adventure.  
We hopped on the **Yellow Line**, switched to the **Green Line**, got off at **Banashankari**, and then took a cab to campus.

We ended up reaching almost an hour late (classic us 😭) — although it didn't matter.  
People were still being checked in at the entrance of MRD, half the teams as clueless as we were.
Somehow.... that was comforting. 

---

## Designing Catalyst ➤

Once we had agreed on the problem, we had to figure out **how** to actually solve it.

In theory, our goal was — building and running C projects portable across Windows, Linux, and macOS.  
In practice, that meant handling a ton of things like compiler setups, library dependencies, build scripts, paths, and external resources like GloVe embeddings — without making the user go through multiple tabs and installation guides.

After scribbling on my iPad for a fair amount of time and discussing with team members over implementation details.  

The plan we came up with was :

- **Automatic environment setup:** Detect the OS and configure compilers, paths, and dependencies accordingly.  
- **Unified build translator:** Adapt Makefiles and linking rules dynamically so a project could just "build".  
- **Resource manager:** Download and manage external assets like big data files automatically.  

---

## Building It Out ➤

Once the idea was locked, it was time to actually **code**. (ooo... scary)

Catalyst was built as a **CLI framework in Go**. Running `catalyst` would list all the available commands, letting devs choose what to do next. The first command we implemented was `catalyst init`, which **auto-generated a `catalyst.yml`** containing sensible defaults for dependencies, external resources, and build settings.  

We used [Cobra CLI](https://github.com/spf13/cobra) to handle the CLI structure, which made subcommands like `init`, `install`, and `build` clean & intuitive. Each command had proper flags, help text, and argument parsing, making Catalyst usable even for devs unfamiliar with its inner workings.  

One of the key features was **automatic detection of external dependencies**. We wrote a routine that **looped through all `.c` and `.h` files**, and used **regex to extract every `#include` statement**. Catalyst then collected all headers — native, external, or local — and automatically downloaded or linked the required libraries. This eliminated the need for developers to manually figure out missing packages or their installation methods across different OSes.  

Windows was the ultimate testbed:  
- `.sh` scripts wouldn’t run without WSL.  
- Libraries like `libmicrohttpd` and `cJSON` had to be carefully handled via MSYS2.  
- Incorrect include paths or linker flags could instantly break builds.  

Linux and macOS were calmer, but still needed to handle different package managers and filesystem paths. Debugging often ended in a mix of facepalms and laughter as we untangled OS-specific quirks.  

By the end, we had a **working CLI framework** that could:  
- Show available commands to the user (`catalyst` → list of commands)  
- Auto-generate project scaffolds and configuration YAMLs (`catalyst init`)  
- Install system dependencies across platforms (`catalyst install`)  
- Fetch external resources automatically  
- Compile projects with minimal manual intervention (`catalyst build`)  

It wasn’t perfect, edge cases weren't accounted for, some data were hardcoded — but it worked across Mac, Linux, and Windows, achieving the cross-platform portability we aimed for. Maybe not for all repos but most of them.

On a side note — our team crossed **100 commits** on github in under 24hrs :)
(none of the commits involved docs change...trust me 🤫)
![Commits](../../images/hashcode-commit.png)

---

## Learning ➤

One of the first lessons came from Go itself. Running `go install github.com/Sabique-Islam/catalyst@latest` didn’t always fetch the newest version because of [Go module caching](https://drewdevault.com/2021/08/06/goproxy-breaks-go.html). At first, I thought it was a proxy delay, but turns out the local cache was serving older builds. Only by using the latest commit hash (`go install github.com/Sabique-Islam/catalyst@<hash>`) did we get the actual latest version (Trial & Error... hehe). Thanks to [Nathan](https://polarhive.net) for correcting me about the underhood logic about this.

Designing the [CLI with Cobra in Go](https://cobra.dev/docs/how-to-guides/shell-completion/) was a lesson in structure. Commands, flags, and help text and how to implement them. Watching someone else run `catalyst init` and immediately understand what to do was a small victory.

The reviewers came around to check on progress periodically. We noticed they spent more time with us than with most other teams — of course my idea was goated :) Their questions were sharp, cross-platform handling, and dependency management. They offered crazy tips and suggestions, pointing out ways to make Catalyst better.

---

![Stickers](../../images/hashcode-stickers.jpeg)

---

## Top 7 Announcement ➤

With a decent 3–4 hrs of sleep, I woke up, got freshened up, had little breakfast. We were exhausted, a mix of drained and proud, just sitting there, and celebrating 100+ github commits.

In the last review before the announcements, one of the mentors had asked us to **clone the [curl](https://github.com/curl/curl) repo and run it with Catalyst**. Apparently, the Alpine setup behaves differently across OSes, and he wanted to check if our `catalyst.yml` matched what actually got installed. We opened it… and realized Alpine itself wasn’t even listed in the YAML. Lmao. He ran through it, nodded, and said, *“Ok guys, I checked what I wanted to see”*. From the tone and expression it was clear — we weren’t making it to the Top 7.

Then came the moment — the announcer stepped up to declare the Top 7 teams for the final presentation. One by one, the names were called... and, yep, we weren’t there :)

For a second, that pang of disappointment hit — but honestly? It didn't sting as much as you'd think. Failures matter too. Our learning far outweighs a win.

---

## End Notes ➤

We built something that genuinely solved a problem we faced ourselves, learned a ton about cross-platform development, Go, CLI frameworks, dependency management, and collaboration within a time limit (nothing was preplanned about our implementation). The reviewers insights, the travel, and the tiny wins along the way — all of it counts :)

Seeing how much I have learned compared to last year is the only thrill needed to keep pushing limits.

Thanks to [Saketh](https://www.linkedin.com/in/saketh-pai-53704a310/), [Shailesh](https://www.linkedin.com/in/shailesh-mishraa/), and [Suprith](https://www.linkedin.com/in/suprith-s44/) for being amazing teammates.

---

![Forgive the Camera](../../images/hashcode-setup.jpeg)

---





