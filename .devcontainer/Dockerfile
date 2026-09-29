FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ripgrep jq python3 \
    && rm -rf /var/lib/apt/lists/*

# Keep exploration tools separate from this site's Svelte/Vite dependencies.
# Install the browser binaries with the same version of Playwright as the CLI.
# Keep in step with @playwright/test in package.json, which uses these browsers.
ARG PLAYWRIGHT_VERSION=1.58.2
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
ENV NODE_PATH=/opt/browser-tools/node_modules

RUN npm install --prefix /opt/browser-tools --save-exact "playwright@${PLAYWRIGHT_VERSION}" \
    && /opt/browser-tools/node_modules/.bin/playwright install --with-deps chromium firefox webkit \
    && ln -s /opt/browser-tools/node_modules/.bin/playwright /usr/local/bin/playwright \
    && chmod -R a+rX /opt/browser-tools /opt/playwright-browsers \
    && rm -rf /var/lib/apt/lists/*

# Coding assistants are available on PATH in every container terminal.
# Build arguments allow pinning releases when a reproducible version is needed.
ARG CODEX_VERSION=latest
ARG CLAUDE_CODE_VERSION=latest
RUN npm install --global \
        "@openai/codex@${CODEX_VERSION}" \
        "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"

USER node

# Fail the image build if either CLI cannot run as the development user.
RUN codex --version && claude --version
