# 06 — AI Architecture

## Position in the System

AI is an **enhancement layer**, not the validation engine. All validation decisions are made
using deterministic rules and evidence. AI runs strictly **after** deterministic validation, as
the second-to-last pipeline stage:

```
Validation Engines → Confidence Engine → Evidence Engine → AI Engine → Final Report
```

## What AI Should Do

- Explain findings
- Improve readability
- Suggest possible fixes / root causes / remediation steps
- Generate executive summaries
- Improve overall report readability

## What AI Must Never Do

- Decide pass/fail
- Detect bugs independently
- Replace deterministic validation
- Modify audit results
- Access the live application directly
- Create new findings

## Supported Providers

Provider-agnostic via a common interface. Initial providers: **OpenAI, Claude, Gemini**.
Switching providers should require **only configuration changes**, never code changes to any
Engine.

```
AI Engine → Provider Interface → OpenAI / Claude / Gemini
```

This abstraction exists specifically to prevent vendor lock-in.

## AI Input — structured data only

Example inputs: finding title, severity, confidence, expected result, actual result, evidence
references. **AI never accesses the application directly** — it only ever sees structured,
already-decided data.

## AI Output

Human-readable explanation, suggested fix, business impact, summary. **The original finding is
never altered by AI output.**

## Prompt Strategy & Rules

Every prompt must include: clear instructions, structured input, expected output format, response
constraints. Prompts should be version-controlled alongside the application code (not
hand-edited ad hoc in production).

Prompts must instruct the model to:
- Stay concise
- Avoid assumptions
- Use only provided evidence
- Never invent missing information
- Clearly state uncertainty when evidence is insufficient

## Hallucination Prevention

- Provide structured inputs only.
- Never ask the AI to inspect live applications.
- Never allow AI to create new findings.
- Require evidence-backed explanations.
- If evidence is insufficient, the AI should say so rather than speculate.

## Failure Handling

If a provider is unavailable: continue the audit, generate the report **without** AI content, log
the failure. **AI failure must never block report generation.**

## Performance

Cache repeated prompts where appropriate; batch requests when possible; keep prompts concise;
limit unnecessary token usage.

## Privacy

AI requests must exclude unnecessary sensitive data. Never send: credentials, authentication
tokens, secrets, internal configuration values. Send only the minimum data required for
explanation.

## Future (advisory-only) Capabilities

Bug severity suggestions, duplicate finding grouping, release summaries, trend analysis, natural
language search — all of these remain advisory only; none of them may become decision-making.

## Definition of Success — AI Layer

Validation remains deterministic; AI explanations are clear and useful; providers can be swapped
easily; AI failures never interrupt audits; **no AI output changes the original validation
result.**
