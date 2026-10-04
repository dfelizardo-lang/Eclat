# The speech engine and voice models are build tools, absent from the web runtime.
FROM node:22-bookworm-slim AS narration
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates python3 ffmpeg && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/piper-models && curl -fL --retry 3 https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz -o /opt/piper.tar.gz && echo 'a50cb45f355b7af1f6d758c1b360717877ba0a398cc8cbe6d2a7a3a26e225992  /opt/piper.tar.gz' | sha256sum -c - && tar -xz -C /opt -f /opt/piper.tar.gz && rm /opt/piper.tar.gz
ARG VOICE_REV=c10ece1aade47bb51c153c893d14e5bf8e5b7117
RUN for voice in siwis tom; do for ext in onnx onnx.json; do curl -fL --retry 3 "https://huggingface.co/rhasspy/piper-voices/resolve/${VOICE_REV}/fr/fr_FR/${voice}/medium/fr_FR-${voice}-medium.${ext}" -o "/opt/piper-models/${voice}.${ext}"; done; done
RUN echo '641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99  /opt/piper-models/siwis.onnx\nbf65074ccdeeeeaa832e75edb1c0a513c01c9a972bdf085ff8a6e71ea234fd41  /opt/piper-models/tom.onnx' | sha256sum -c -
WORKDIR /app
COPY scripts/narration-input.cjs scripts/build-narration.py ./scripts/
COPY data/reading-catalog.json ./data/reading-catalog.json
COPY eclat_v73_deployable.html ./
RUN NARRATION_SEED_URL=https://eclat-v1-sync-production.up.railway.app python3 scripts/build-narration.py

FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
COPY --from=narration /app/narration ./narration
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","server.js"]
