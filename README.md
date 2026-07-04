# Overturn — Claims Denial Appeal Agent

A web-based enterprise agent that helps hospital billing teams fight wrongful
insurance denials. It reads a denial letter, retrieves the insurer's own
published medical policy, checks the patient's chart against every policy
criterion, calls deterministic tools for date math and code checks, and
produces either a filing-ready appeal letter with pinpoint citations or an
honest "this case is weak, here's what to obtain first" report.

Built for the RAISE Summit Hackathon 2026 (Vultr track). Planning, reasoning,
and retrieval orchestration run entirely on Vultr Serverless Inference. All
data is synthetic.

*Full README coming in Phase 6.*

> This system evaluates documentation against payer policy criteria. It makes
> no clinical judgments. All appeals require human reviewer sign-off before
> filing.
