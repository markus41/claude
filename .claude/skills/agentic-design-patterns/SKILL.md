# Agentic Design Patterns

> Based on "Agentic Design Patterns" by Antonio Gulli & Mauro Sauco (2025)
> 21 patterns across 4 tiers for building production-grade AI agent systems

## Pattern Catalog

### Part 1: Foundational Patterns

#### 1. Prompt Chaining (Pipeline)
Decompose complex tasks into sequential sub-problems where each step's output feeds the next.

**When to use**: Task too complex for single prompt, multiple processing stages, external tool integration between steps.

**Implementation**:
- Assign distinct roles per stage (Analyst → Transformer → Writer)
- Use structured output (JSON/XML) between stages for data integrity
- Insert validation gates/checkpoints between steps
- Enable conditional branching via deterministic logic

**Anti-patterns**: Using for simple queries; ignoring latency cost of chaining.

```
Input → [Step 1: Extract] → Gate → [Step 2: Transform] → Gate → [Step 3: Generate] → Output
```

#### 2. Routing
Introduce conditional logic for dynamic execution path selection based on input analysis.

**Types**:
- **LLM-Based**: Model classifies intent and selects handler
- **Embedding-Based**: Semantic similarity matching against route embeddings
- **Rule-Based**: Deterministic pattern matching (fast, predictable)
- **ML Model-Based**: Trained classifiers for routing decisions

**When to use**: Varying input complexity, multiple specialized handlers, need for adaptive behavior.

**Implementation**:
- Router agent classifies incoming requests
- Routes to specialized handlers based on complexity/domain
- Support fallback routing for unmatched inputs

#### 3. Parallelization (Fan-Out/Fan-In)
Execute independent tasks concurrently and aggregate results at synchronization points.

**Variants**:
- **Sectioning**: Divide work into independent segments
- **Voting**: Multiple agents solve same problem, consensus determines answer
- **Scatter-Gather**: Distribute to many, collect from all

**When to use**: Independent data lookups, multi-source research, validation checks, content generation.

**Implementation**:
- Fan-out: Distribute independent sub-tasks to parallel workers
- Fan-in: Aggregate results at synchronization barrier
- Use async/concurrent execution (not true parallelism needed)

#### 4. Reflection (Self-Critique)
Agent evaluates its own output and iteratively refines it through feedback loops.

**Architecture**: Producer-Critic separation
- **Producer Agent**: Generates content without self-judgment constraints
- **Critic Agent**: Evaluates against criteria (accuracy, completeness, style)
- **Loop**: Generate → Critique → Refine → (repeat until quality threshold met)

**When to use**: Quality > speed, complex content generation, code review, planning.

**Stopping conditions**: Quality score threshold, max iterations, explicit "PERFECT" signal.

#### 5. Tool Use (Function Calling)
Enable agents to interface with external systems via structured function definitions.

**Execution flow**:
1. Tool Definition (schema with purpose, params, types)
2. LLM Decision (assess if tool needed)
3. Call Generation (structured JSON output)
4. Tool Execution (orchestration layer runs function)
5. Result Observation (output returned to agent)
6. LLM Processing (incorporate results)

**Strategies**: Sequential, Chained, Parallel, Delegated, Conditional.

**Safety**: Sandboxed execution, least privilege, input validation, audit logging.

#### 6. Planning (Plan-and-Execute)
Formulate action sequences from initial state to goal state with dynamic replanning.

**Key question**: "Does the 'how' need to be discovered, or is it already known?"

**Approaches**:
- Task decomposition into manageable sub-tasks
- Dynamic replanning when obstacles emerge
- Integration with reflection for plan validation
- Iterative query refinement based on gathered information

**When to use**: Complex multi-step objectives, unknown solution paths, research tasks.

#### 7. Multi-Agent Collaboration
Structure systems as cooperative ensembles of specialized agents.

**Topologies**:
| Topology | Description | Best For |
|----------|-------------|----------|
| Single Agent | Standalone operation | Simple tasks |
| Network (Flat) | Peer-to-peer, decentralized | Resilient systems |
| Supervisor (Hub-Spoke) | Central coordinator | Clear authority |
| Hierarchical | Multi-layered supervisors | Complex decomposition |
| Custom/Hybrid | Tailored combinations | Specific requirements |

**Collaboration models**: Sequential Handoffs, Parallel Processing, Debate & Consensus, Hierarchical Delegation, Critic-Reviewer.

### Part 2: Advanced Systems

#### 8. Memory Management
Retain and utilize information across interactions for context, learning, and personalization.

**Memory types**:
- **Short-Term (Context Window)**: Current session, ephemeral
- **Long-Term (Persistent)**: Vector DBs, knowledge graphs, files
- **Semantic**: Facts and preferences (updated profiles)
- **Episodic**: Past events and interaction sequences (few-shot examples)
- **Procedural**: Rules and behavioral guidelines (self-modifiable prompts)

**State prefixes**: No prefix (session), `user:` (cross-session), `app:` (shared), `temp:` (turn-only).

**Best practices**: Keep state simple, clear key names, avoid deep nesting, update through event processing.

#### 9. Learning and Adaptation
Evolve beyond initial programming through experience and environmental interaction.

**Approaches**:
- **Few-Shot/Zero-Shot**: Rapid adaptation with minimal examples
- **Online Learning**: Continuous updates with streaming data
- **Memory-Based**: Recall past experiences for similar situations
- **Self-Improvement**: Autonomous code/prompt modification (SICA pattern)
- **Evolutionary**: LLM-driven generation + evaluation + selection cycles

**Requirements**: Clear evaluation metrics, structured feedback loops, modular architecture, oversight mechanisms.

#### 10. Model Context Protocol (MCP)
Standardized tool integration framework for agent-external system interaction.

**Components**: Resources (data), Tools (actions), Prompts (templates), Sampling (nested LLM calls).

**Key benefit**: Single integration point for diverse external systems.

#### 11. Goal Setting and Monitoring
Define objectives, track progress, and adjust strategies based on measured outcomes.

**Framework**: Set measurable goals → Monitor progress → Detect deviations → Trigger replanning.

**Integration**: Works with Reflection (corrective engine) and Planning (strategy adjustment).

### Part 3: Production Concerns

#### 12. Exception Handling and Recovery
Detect problems, implement appropriate responses, and restore stable operation.

**Detection**: Invalid outputs, API errors, performance degradation, incoherent responses.

**Strategies**:
- **Retry**: With adjusted parameters for transient failures
- **Fallback**: Alternative methods maintaining partial functionality
- **Graceful Degradation**: Reduced but functional operation
- **State Rollback**: Undo error effects
- **Escalation**: Delegate to human operators
- **Self-Correction**: Adjust plans/logic via replanning

**Implementation**: Layered handlers (primary → fallback → response agent).

#### 13. Human in the Loop (HITL)
Integrate human oversight at critical decision points.

**Modes**:
- **Approval Gate**: Human must approve before execution
- **Review Loop**: Human reviews and may modify agent output
- **Escalation**: Agent requests human help when uncertain
- **Collaborative**: Human and agent work together iteratively

**When to use**: High-stakes decisions, safety-critical operations, compliance requirements.

#### 14. Knowledge Retrieval (RAG)
Augment agent responses with retrieved contextual information.

**Pipeline**: Query → Retrieve (vector search) → Augment (inject context) → Generate (informed response).

**Optimizations**: Chunk sizing, embedding model selection, hybrid search (keyword + semantic), re-ranking.

### Part 4: Multi-Agent Architectures

#### 15. Inter-Agent Communication (A2A)
Open HTTP-based standard for agent collaboration across frameworks.

**Components**:
- **Agent Card**: Digital identity (capabilities, endpoint, auth, skills)
- **Messages**: Attributes + Parts (text, files, JSON)
- **Tasks**: Work units with state lifecycle (submitted → working → completed)
- **Artifacts**: Tangible outputs with incremental streaming

**Discovery**: Well-Known URI, Curated Registries, Direct Configuration.

**Interaction modes**: Synchronous, Async Polling, Streaming (SSE), Push Notifications (webhooks).

#### 16. Resource-Aware Optimization
Dynamically manage computational, temporal, and financial resources during operation.

**Strategies**:
- **Model Selection**: Route by complexity (simple→Flash, complex→Pro)
- **Token Budgeting**: Contextual pruning and summarization
- **Fallback Chains**: Sequential model fallback on failure
- **Adaptive Tool Use**: Select tools by cost/latency/reliability
- **Critique Loops**: Quality assessment to avoid unnecessary retries

#### 17. Reasoning Techniques
Advanced problem-solving methods for complex tasks.

**Methods**:
- **Chain-of-Thought (CoT)**: Intermediate reasoning steps
- **Tree-of-Thought (ToT)**: Multiple reasoning paths with backtracking
- **Self-Correction**: Iterative output refinement
- **ReAct**: Reasoning + Acting with tool interaction
- **Chain of Debates (CoD)**: Multi-model collaborative argumentation
- **Graph of Debates (GoD)**: Network-structured argument exploration

**Scaling Law**: Performance improves with inference-time compute, not just model size.

#### 18. Guardrails and Safety Patterns
Protective mechanisms ensuring safe, ethical, trustworthy operation.

**Layers**:
1. Input Validation & Sanitization (schema validation, content moderation)
2. Output Filtering & Post-Processing (toxicity, bias, policy checks)
3. Behavioral Constraints (system-level instructions)
4. Tool Use Restrictions (least privilege)
5. External Moderation APIs (specialized detection)
6. Human-in-the-Loop (critical decision validation)

**Key areas**: Jailbreak prevention, prohibited content, off-domain filtering, hallucination detection.

**Production**: Modular agents, structured logging, checkpointing, principle of least privilege.

#### 19. Evaluation and Monitoring
Systematic performance assessment for operational agent systems.

**Metrics**: Response quality (semantic similarity), latency, token usage, trajectory analysis.

**Methods**:
- **LLM-as-Judge**: Model evaluates subjective qualities
- **A/B Testing**: Parallel comparison of strategies
- **Trajectory Analysis**: Assess action sequences (exact/in-order/any-order match)
- **Contractor Model**: Formalized contracts, negotiation, iterative validation

**Infrastructure**: Persistent logging, structured formats, anomaly detection, drift detection.

#### 20. Prioritization
Rank and order tasks by importance, urgency, and resource availability.

**Frameworks**: Priority queues, deadline-based scheduling, dependency-aware ordering, dynamic reprioritization.

#### 21. Exploration and Discovery
Identify novel capabilities, solutions, and opportunities through systematic investigation.

**Approaches**: Hypothesis-driven exploration, curiosity-based discovery, serendipity handling, knowledge gap identification.

## Pattern Composition Matrix

| Pattern | Combines Well With | Plugins Using |
|---------|-------------------|---------------|
| Prompt Chaining | Planning, Tool Use, Memory | All |
| Routing | Parallelization, Resource-Aware | claude-code-expert, jira-orchestrator |
| Parallelization | Routing, Aggregation | jira-orchestrator, exec-automator |
| Reflection | Planning, Evaluation | upgrade-suggestion, claude-code-expert |
| Tool Use | Guardrails, Exception Handling | All |
| Planning | Reflection, Multi-Agent | jira-orchestrator, deployment-pipeline |
| Multi-Agent | Routing, A2A, Memory | All multi-agent plugins |
| Memory | Learning, RAG | claude-code-expert, jira-orchestrator |
| Guardrails | Tool Use, HITL | All |
| Evaluation | Monitoring, Reflection | All |

## References

- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. 424 pages.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
