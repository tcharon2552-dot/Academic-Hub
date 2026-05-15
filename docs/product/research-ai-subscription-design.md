# Research AI Subscription Service Design

## 1. Goal

Build a vertical AI subscription service for Chinese research users, using New API as the backend model gateway while positioning the product as a research workflow service rather than an API relay.

Primary business goal: maximize risk-adjusted profit through subscription tiers, workflow packaging, cost controls, and team upsell.

## 2. Target Users

### A. Individual Researchers

Primary audience:
- PhD students
- Graduate students
- Early-career researchers
- Independent researchers

Core needs:
- Read papers faster
- Summarize and compare PDFs
- Polish academic writing
- Generate review responses
- Analyze research code and data
- Prepare experiments and literature reviews

### B. Labs and Research Groups

Primary audience:
- PIs
- Small research groups
- Labs
- Institute or department pilots

Core needs:
- Shared literature library
- Shared project workspace
- Member usage control
- Team prompt templates
- Group-level billing
- Contract, invoice, and bank transfer support

## 3. Product Positioning

External positioning:

> AI research assistant for paper reading, literature review, academic writing, code/data analysis, and lab collaboration.

Internal architecture:

> A vertical SaaS layer over New API, with workflow-specific quota accounting, model routing, billing, and cost controls.

Avoid positioning as:
- API relay
- Model reseller
- Unlimited AI access
- Cheap Claude/GPT proxy

## 4. Subscription Strategy

The service uses full tier coverage with a controlled sales motion:

- A0-A3 individual plans are publicly listed and self-serve.
- B1 is publicly listed and self-serve.
- B2 and B3 are listed with benefits and price ranges, but require application or sales approval.
- All tiers support add-on packages.

### Individual Plans

| Tier | Name | Role | Access |
| --- | --- | --- | --- |
| A0 | Free Credits | Registration conversion | Free quota after signup |
| A1 | Student Basic | Low-price entry | Self-serve purchase |
| A2 | Research Pro | Main profit plan | Self-serve purchase |
| A3 | Pro Plus | Heavy individual users | Self-serve purchase |

### Team Plans

| Tier | Name | Role | Access |
| --- | --- | --- | --- |
| B1 | Lab Starter | Entry team plan | Self-serve purchase |
| B2 | Lab Team | Standard lab plan | Apply to activate |
| B3 | Lab Pro / Institute | High-value lab or institute plan | Sales activation |

## 5. Recommended Pricing Direction

Prices should be validated through testing. Initial suggested ranges for China-focused pricing:

| Tier | Suggested Monthly Price | Pricing Intent |
| --- | ---: | --- |
| A0 | Free | Signup conversion |
| A1 | RMB 19-39 | Low-friction student conversion |
| A2 | RMB 69-129 | Main individual profit plan |
| A3 | RMB 199-299 | Heavy user plan and price anchor |
| B1 | RMB 299-599 | Small lab entry |
| B2 | RMB 1,299-2,999 | Standard lab plan |
| B3 | RMB 5,000+/month or annual contract | Institute and high-value group |

Pricing rules:
- Never sell unlimited usage.
- Use monthly quota plus add-ons.
- Use annual discounts only after retention is proven.
- B2/B3 should support contract and invoice workflows.

## 6. Quota Model

Users see research task quotas instead of raw token quotas.

Examples:
- Paper reading credits
- Long document credits
- Literature review credits
- Advanced model credits
- Code/data analysis credits
- Team member seats

Backend accounting still maps to:
- Token usage
- Model cost multiplier
- PDF page count
- Context length
- Request count
- Concurrent jobs
- Storage and embedding cost

## 7. Feature Matrix

### A0 Free Credits

Purpose:
- Let users experience the product quickly.
- Drive upgrade when credits run out.

Included:
- Limited paper reading
- Single PDF summary
- Basic academic Q&A
- Basic writing polish

Limits:
- Low daily task limit
- No batch literature review
- No team workspace
- Limited advanced model access

Upgrade triggers:
- Free quota exhausted
- User uploads multiple papers
- User requests long document processing
- User asks for advanced writing or code analysis

### A1 Student Basic

Purpose:
- Low-price paid entry.
- Convert price-sensitive students.

Included:
- Single-paper reading
- Basic PDF summary
- Paper outline extraction
- Citation format help
- Basic academic writing polish

Limits:
- Strict advanced model quota
- Limited long document processing
- Limited batch tasks
- Standard queue priority

### A2 Research Pro

Purpose:
- Main individual profit plan.

Included:
- Batch paper comparison
- Literature review drafts
- Long PDF reading
- Academic writing rewrite
- Abstract, introduction, and discussion assistance
- Review response drafting
- Code and data analysis assistance
- Experiment design suggestions

Controls:
- Daily task quota
- Advanced model quota
- Long document quota
- Reasonable queue priority

### A3 Pro Plus

Purpose:
- Heavy individual users and high-price anchor.

Included:
- More advanced model credits
- More long document credits
- Priority queue
- Submission sprint workflows
- Larger personal project space
- Better batch review capacity

Controls:
- Still quota-based
- No unlimited promise
- Add-ons for excessive usage

### B1 Lab Starter

Purpose:
- Convert individual users into small team subscriptions.

Included:
- 3-5 members
- Shared quota pool
- Shared literature library
- Basic team workspace
- Member management
- Usage dashboard

Sales motion:
- Self-serve purchase
- In-product upgrade from A2/A3 when users invite peers or create shared projects

### B2 Lab Team

Purpose:
- Main team revenue tier.

Included:
- 10-20 members
- More team quota
- Multiple project spaces
- Shared prompt templates
- Lab-level literature collections
- Grant proposal workflow
- Peer review workflow
- Team usage analytics

Sales motion:
- Application required
- Manual review of lab size, use case, and support needs

### B3 Lab Pro / Institute

Purpose:
- High-value labs, institutes, and department pilots.

Included:
- SSO option
- Audit logs
- Private knowledge base
- Dedicated model routing policy
- Contract and invoice support
- Optional deployment or data isolation discussion

Sales motion:
- Sales activation
- Contract-based pricing
- No public self-serve purchase

## 8. Add-On Packages

Add-ons should be available across tiers:

- Research task pack
- Advanced model pack
- Long document pack
- Batch literature review pack
- Team member pack
- Extra storage pack

Rules:
- Add-ons expire monthly or quarterly depending on pricing.
- Add-ons should have higher effective margin than base quota.
- Heavy usage prompts add-on purchase before hard failure.

## 9. New API Mapping

New API is used as the model gateway and quota enforcement layer.

### User Groups

Create groups for:
- free
- student_basic
- research_pro
- pro_plus
- lab_starter
- lab_team
- institute

Each group controls:
- Available models
- Model cost multipliers
- Request rate limits
- Concurrent request limits
- Daily/monthly quota
- Channel fallback policy

### Model Routing

Routing principles:
- Basic summaries and Q&A use lower-cost models.
- Long-context tasks use models selected by context length and cost.
- High-value writing, review response, and difficult reasoning tasks can use premium models.
- Embedding and rerank calls should be routed through cost-efficient providers.

### Cost Controls

Required controls:
- Daily task cap
- Monthly quota cap
- Per-document page limit
- Per-job token ceiling
- Advanced model quota
- Concurrent job limit
- Abuse detection
- Queueing for heavy jobs

## 10. Research Workflow Layer

The product layer should expose workflows, not model names.

Core workflows:

1. Paper Reader
   - Upload PDF
   - Extract title, abstract, methods, results, limitations
   - Ask questions against the paper

2. Literature Review
   - Upload multiple papers
   - Compare methods, datasets, conclusions, limitations
   - Generate review outline

3. Academic Writing
   - Rewrite paragraphs
   - Polish Chinese/English academic text
   - Generate abstract, introduction, discussion, and conclusion drafts

4. Reviewer Response
   - Parse reviewer comments
   - Draft structured responses
   - Suggest experiments or revisions

5. Research Code and Data
   - Explain code
   - Debug scripts
   - Suggest statistical analysis
   - Generate Python/R/Matlab snippets

6. Lab Workspace
   - Shared papers
   - Shared prompts
   - Team projects
   - Member quotas

## 11. Payment Strategy

The service is primarily China-focused.

### P0 Payment Methods

Required:
- WeChat Pay
- Alipay
- Bank transfer for team plans
- Contract and invoice support for B2/B3

### P1 Payment Methods

Recommended after initial launch:
- Balance recharge
- Add-on package purchase
- Team member add-on purchase

### P2 Optional Crypto Payment

Crypto payment can be reserved as an optional capability, but should be compliance-isolated.

Rules:
- Do not make crypto payment the default China-facing payment method.
- Do not publicly market crypto payment to mainland China users.
- Only expose crypto payment for overseas users, manually reviewed users, or controlled gray release.
- Keep crypto orders, payment records, and accounting separate.
- Add explicit compliance review before implementation.

Possible future options:
- OKX Pay
- USDT payment through a compliant offshore setup

## 12. Conversion Path

Primary path:

1. User registers and receives A0 free credits.
2. User uploads a PDF or uses writing polish.
3. Free credits run out.
4. User sees upgrade prompt for A1 and A2.
5. Heavy users upgrade to A2 or A3.
6. Users who invite peers or create shared libraries see B1 upgrade prompts.
7. B1 teams with more members, projects, or quota needs are prompted to apply for B2.
8. High-value labs are moved into B3 sales workflow.

Upgrade triggers:
- Free quota exhausted
- Long document requested
- Batch paper workflow requested
- Advanced model quota exhausted
- User invites teammates
- Shared library created
- Team member count exceeds B1
- Team usage exceeds threshold

## 13. Admin and Operations

Admin capabilities needed:
- User plan management
- Manual quota grant
- Add-on management
- Team member management
- B2/B3 application review
- Payment reconciliation
- Invoice status tracking
- Usage anomaly detection
- Refund and compensation handling

Key metrics:
- Free-to-paid conversion
- A1-to-A2 upgrade rate
- A2/A3 gross margin
- Heavy user cost concentration
- B1 team activation rate
- B1-to-B2 application rate
- Refund rate
- Support tickets per 100 users
- Model cost per active user

## 14. MVP Scope

MVP should include all tiers in the pricing and billing model, with controlled delivery depth.

Must launch:
- A0 free credits
- A1/A2/A3 self-serve plans
- B1 self-serve plan
- B2/B3 application forms
- WeChat/Alipay or at least one domestic payment provider
- Bank transfer workflow for teams
- Basic PDF reader
- Academic writing polish
- Literature review for multiple papers
- New API group mapping
- Basic quota and usage dashboard

Can launch later:
- Crypto payment
- SSO
- Audit logs
- Advanced team analytics
- Private deployment
- Full invoice automation

## 15. Key Risks

### Compliance

Crypto payments are sensitive for mainland China users. Keep them optional, isolated, and subject to legal review.

### Margin

Heavy users can consume disproportionate model cost. Use task caps, model routing, queues, and add-ons.

### Positioning

If marketed as an API relay, the product will face price competition and weak loyalty. Keep the external narrative focused on research workflows.

### Delivery

B2/B3 can create custom-service pressure. Use application approval and scope control.

## 16. Pre-Implementation Defaults

These defaults keep implementation concrete while leaving room for later pricing tests.

1. Initial public pricing starts with A1, A2, A3, and B1 only. B2 and B3 use price ranges and application forms.
2. Domestic payment starts with one provider that can support WeChat Pay and Alipay. Bank transfer is handled manually for B plans.
3. Initial model providers should include one high-quality frontier provider, one domestic low-cost provider, and one embedding/rerank provider.
4. Uploaded PDFs are stored by default for authenticated users so projects and shared libraries work. Users should be able to delete files.
5. MVP is web-first. API access is not publicly sold in the first release, because it weakens the workflow positioning and increases cost-control risk.
