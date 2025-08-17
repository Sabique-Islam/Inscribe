---
title: "Pull Requests Too Long? Meet the GitHub PR Summarizer Bot"
description: "Emerged from the pain of reviewing group project PRs - a bot that automatically summarizes pull requests using GitHub Actions."
date: 2025-08-17
tldr: Built during a group project where PR reviews felt like one of those "No wayyy!" moments, this bot automatically generates summaries to make the process quicker and easier.
draft: false
tags: ["GitHub", "AI", "developer tools", "open source", "college projects", "GitHub Actions", "automation", "Gemini", "pull requests", "code review", "productivity", "bots", "software engineering", "hackathon", "college hacks", "workflow automation", "devtools", "PR summarizer", "AI in dev", "team collaboration"]
toc: true
---

---

# GitHub PR Summarizer Bot ➤

Okay, so here’s the deal - I did not build this thing to be a productivity hero. I was literally **too lazy** to read PRs. Stacks of pull requests? My brain just went: *“Huh??!”*

So I thought: *“What if the PR could just explain itself to me?”*

That’s how I got the idea for **GitHub PR Summarizer Bot**.

---

## Making the Bot ➤

The “plan” (if you can call it that) was simple:

* Whenever a PR opens, trigger a GitHub Action.
* Grab the PR number, repo name, and diff.
* Hand it off to an AI model.
* Get back a short, clean summary.
* Post that into the PR as a comment.

---

### The Trigger ➤

```yml
name: PR Summarizer

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write
  contents: read
```

> The workflow triggers on three PR events →
- **Opened**: When a new PR is created
- **Synchronize**: When new commits are pushed to an existing PR
- **Reopened**: When a closed PR is reopened

> We request specific permissions to read repository contents and write comments to pull requests

---

### [Job Definition ➤](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

```yml
jobs:
  summarize:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: 3.11

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
```

Set up an Ubuntu environment (I use arch btw), installs Python 3.11, and install dependencies.

---

### Core Engine ➤

```yml
- name: Summarize PR using Gemini
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PR_NUMBER: ${{ github.event.pull_request.number }}
    GITHUB_REPOSITORY: ${{ github.repository }}
  run: |
    python ./src/main.py > summary.txt
    SUMMARY=$(cat summary.txt)
    echo "$SUMMARY"
```

**Environment Variables Explained →**

* **GEMINI\_API\_KEY** → Secret API key for Google's Gemini AI model. [[Get yours here](https://aistudio.google.com/apikey)]
* **GITHUB\_TOKEN** → Automatically provided by GitHub for API access.
* **PR\_NUMBER** → The current pull request number from the GitHub context.
* **GITHUB\_REPOSITORY** → The repository name in `owner/repo` format.

> Note: Never commit environment variables to your repo. Always keep them in a .env (or .env.*) file.

![Meme](../../images/env.png)

---

## [The Brain ➤](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28)

The main orchestrator handles GitHub API interactions and coordinates everything:

```python
import os
import requests
from summarizer import generate_summary

GITHUB_API = "https://api.github.com"
REPO = os.getenv("GITHUB_REPOSITORY")
PR_NUMBER = os.getenv("PR_NUMBER")
TOKEN = os.getenv("GITHUB_TOKEN")

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json"
}
```

**Setup ➤**

* Fetch environment variables set by the GitHub Action
* Set up headers for GitHub API authentication using Bearer token
* Use the v3 GitHub API with JSON responses

---

### Fetching PR Data ➤

```python
def get_pr_data():
    pr_url     = f"{GITHUB_API}/repos/{REPO}/pulls/{PR_NUMBER}"
    files_url  = f"{pr_url}/files"

    pr_resp    = requests.get(pr_url, headers=headers)
    files_resp = requests.get(files_url, headers=headers)

    pr_body    = pr_resp.json().get("body", "")
    file_changes = files_resp.json()

    diff = "\n".join([
        f"{file['filename']}\n{file.get('patch', '')}"
        for file in file_changes
        if 'patch' in file
    ])

    return pr_body, diff
```
Now things start getting real →

* Two API calls: One for PR metadata, another for file changes
* Extract PR description: The `body` field contains the PR description
* Build diff string: Combine filename and patch for each changed file (lmao so messy code 😭)
* Filter patches: Only include files that have actual code changes (some files might be binary)

---

### Posting the Comment ➤

```python
def post_comment(comment):
    url = f"{GITHUB_API}/repos/{REPO}/issues/{PR_NUMBER}/comments"
    requests.post(url, headers=headers, json={"body": comment})
```

> GitHub treats PR comments as issue comments in the API, which is why we use the `/issues/{PR_NUMBER}/comments` endpoint.

---

### Main Flow ➤

```python
if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("[DEBUG] GEMINI_API_KEY is not set.")
    pr_body, diff = get_pr_data()
    summary = generate_summary(pr_body, diff)
    post_comment(f"**PR Summary**\n\n{summary}")
```

To fetch the data, generate summary, post comment.

---

## LLM Logic ➤

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
```

Configure the Gemini client with our API key from the environment.

---

### Summarization Function ➤

```python
def generate_summary(pr_body, diff):
    prompt = f"""
You are a GitHub bot. Summarize the following pull request based on its description and code diff:

### PR Description:
{pr_body}

### Code Diff:
{diff[:8000]}  # truncate to avoid token limit

Respond concisely in bullet points.
"""

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()
```

**Key decisions here ➤**

* **Model choice**: `gemini-2.5-flash` is fast and has massive context window `(that said, it's free :)`
* **Token limiting**: Truncate diff to 8000 characters to stay within API limits

---

Repo’s here if you wanna peek :
[github-pr-bot](https://github.com/Sabique-Islam/github-pr-bot)

---

![prBOT Description](../../images/prbot.png)

---

## Looking Back ➤

What started as pure laziness turned into one of the most useful things I have built.

Of course, in a plot twist, I later got **GitHub Student Pro**, which meant **Copilot** could just summarize PRs straight-up (and honestly, it’s way better 😭).
But hey - building my own bot first made me actually *understand* how these things work.

---