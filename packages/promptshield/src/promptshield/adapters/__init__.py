"""Generator-stack adapters.

Each adapter exposes a way to wire PromptClassifier into a specific
generation pipeline so the gate fires before any compute is spent on
sampling. Scaffold stage: API surfaces only, no upstream dependency
yet. Use `pip install "promptshield[diffusers]"` / `[vllm]` to pull
the adapter's runtime deps when ready.
"""
