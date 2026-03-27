---
name: Agentic Design Patterns Research
description: Comprehensive research on agentic AI design patterns from Andrew Ng, Mathews-Tom repo, and implementation resources
type: reference
---

# Agentic Design Patterns: Comprehensive Research

**Source Repository**: [Mathews-Tom/Agentic-Design-Patterns](https://github.com/Mathews-Tom/Agentic-Design-Patterns)
**Key Course**: [Andrew Ng's Agentic AI - DeepLearning.AI](https://learn.deeplearning.ai/courses/agentic-ai/)

## Overview

Agentic Design Patterns represent reusable ways of organizing reasoning, actions, and coordination in AI systems. They solve recurring problems by providing structured alternatives to monolithic agents while avoiding unstructured multi-agent chaos.

The field encompasses **21 core patterns** organized in a comprehensive framework that spans from foundational patterns through advanced multi-agent architectures.

---

## Andrew Ng's Four Core Patterns

Andrew Ng identified four foundational patterns that drive significant progress in agentic AI:

### 1. Reflection

**What It Is**
- LLM examines and critiques its own output, then iterates to improve quality
- Introduces a review-and-refine loop instead of single-pass generation
- Surprisingly simple to implement but dramatically improves output quality

**How It Works**
1. Agent generates initial output
2. Agent receives critique prompt (e.g., "Check for correctness, style, and efficiency")
3. Agent reviews its work against feedback or error signals
4. Agent refines and improves the output
5. Cycle repeats until quality threshold met

**Implementation Approach**
- Use a critique prompt that asks the model to "think carefully" about specific quality dimensions
- Feed error messages, test results, or execution feedback back into the loop
- Implement as a simple loop: Generate → Evaluate → Refine
- Can use the same model (different prompt) or different models for generation and evaluation

**When to Use**
- Code generation (with execution/test feedback)
- Writing and content creation (checking clarity, tone, completeness)
- Data analysis (validating accuracy of results)
- Problem-solving (verifying solution feasibility)

**Performance Impact**
- Up to 15.6% better accuracy than monolithic prompts
- Introduces iterative refinement that catches errors and identifies weaknesses

---

### 2. Tool Use (Function Calling)

**What It Is**
- LLM decides which functions/APIs to call to accomplish tasks
- Extends capabilities far beyond pure language generation
- Integrates with external systems, databases, APIs, web services, productivity tools

**How It Works**
1. Agent analyzes task and determines required tools
2. Agent calls appropriate function/API with parameters
3. Agent receives results from tool execution
4. Agent processes results and decides next action
5. Repeat until task completion

**Available Tools**
- Math and data analysis
- Web fetching and information gathering
- Database queries
- Code execution
- Email, calendar, productivity apps
- API integrations
- Custom business tools

**Implementation Approach**
- Use Model Context Protocol (MCP) for standardized tool integration
- Define clear function signatures with input/output specifications
- Implement error handling for tool failures
- Provide context about when each tool is appropriate
- Use tool-use frameworks like LangGraph, AutoGen, or CrewAI

**When to Use**
- Any task requiring external data or actions
- Real-world applications needing to interface with systems
- Tasks requiring computation beyond LLM capabilities
- Workflows needing persistent state changes

---

### 3. Planning

**What It Is**
- Agent autonomously determines sequence of actions (not hard-coded)
- Agent analyzes goals, breaks into subtasks, identifies dependencies
- Plans can be linear or include parallel branches

**How It Works**
1. Agent receives overall goal and understands success criteria
2. Agent analyzes goal and breaks into smaller subtasks
3. Agent identifies dependencies between tasks
4. Agent determines which steps run sequentially vs. in parallel
5. Agent organizes subtasks into logical execution order
6. Agent executes plan, adapting as needed

**Plan Structure**
- Linear sequence of API calls for simple tasks
- Branching plans with conditional logic
- Parallel execution for independent subtasks
- Dynamic plans that adapt based on intermediate results

**Implementation Approach**
- Start with a planning prompt that asks for subtask decomposition
- Include dependency analysis in the planning step
- Use structured plan representation (JSON, YAML, or task lists)
- Implement plan execution with error handling and adaptation
- Allow agent to update plan based on execution results

**When to Use**
- Complex multi-step tasks requiring coordination
- Workflows with dependencies or conditional branching
- Tasks where the execution sequence matters
- Situations requiring flexibility and adaptation

---

### 4. Multi-Agent Collaboration

**What It Is**
- Multiple specialized agents work together toward complex goals
- Each agent has distinct role and expertise
- Agents coordinate to accomplish tasks beyond individual capability

**How It Works**
1. Orchestrator receives task
2. Orchestrator delegates to specialized agents based on task requirements
3. Individual agents execute their specialized functions
4. Agents coordinate and share results
5. Orchestrator synthesizes final result

**Agent Specialization Examples**
- Research agent - gathers and synthesizes information
- Marketer agent - crafts marketing angles and messaging
- Editor agent - refines and polishes content
- Technical agent - handles code and architecture
- Business agent - evaluates financial and strategic aspects

**Implementation Approach**
- Create specialized agents with distinct system prompts
- Implement orchestration/coordination mechanism
- Define communication protocol between agents
- Use inter-agent messaging for collaboration
- Consider resource optimization (cost, latency, quality tradeoffs)

**When to Use**
- Complex workflows requiring diverse expertise
- Tasks beyond single agent's capability
- Scenarios benefiting from division of labor
- High-stakes decisions requiring multiple perspectives
- Scalable systems needing specialization

---

## Extended Pattern Framework (21 Total Patterns)

The comprehensive framework from the Mathews-Tom repository extends beyond these four with additional patterns:

### Part One: Foundational Patterns (7 patterns)
1. **Prompt Chaining** - Sequential task execution through connected prompts
2. **Routing** - Directing inputs to appropriate processing paths
3. **Parallelization** - Executing multiple tasks simultaneously
4. **Reflection** - Self-evaluation and iterative improvement
5. **Tool Use** - Integration of external tools and APIs
6. **Planning** - Strategic task decomposition and sequencing
7. **Multi-Agent Collaboration** - Coordinated multi-agent systems

### Part Two: Enhancement Patterns (4 patterns)
8. **Memory Management** - Storing and retrieving contextual information
9. **Learning and Adaptation** - Improving performance through experience
10. **Model Context Protocol (MCP)** - Standardized tool integration
11. **Goal Setting and Monitoring** - Objective tracking and progress measurement

### Part Three: Production Concerns (3 patterns)
12. **Exception Handling and Recovery** - Error management and resilience
13. **Human-in-the-Loop** - Human oversight and decision involvement
14. **Knowledge Retrieval (RAG)** - Leveraging external knowledge bases

### Part Four: Optimization Patterns (7 patterns)
15. **Inter-Agent Communication** - A2A messaging and coordination
16. **Resource-Aware Optimization** - Cost and latency optimization
17. **Reasoning Techniques** - Enhanced reasoning strategies
18. **Guardrails and Safety** - Safety mechanisms and constraints
19. **Evaluation and Monitoring** - Quality assurance and metrics
20. **Prioritization** - Task prioritization and scheduling
21. **Exploration and Discovery** - Systematic exploration strategies

---

## Additional Core Patterns Beyond Andrew Ng's Four

### Prompt Chaining

**What It Is**
- Breaks complex tasks into smaller, sequential steps
- Each output feeds into next input
- Enables intermediate validation and modular design

**How It Works**
1. Step 1: Process input with focused prompt → Output A
2. Step 2: Use Output A as input with different prompt → Output B
3. Step 3: Continue chaining → Final Output
4. Each step is optimized for specific subtask

**Implementation Approach**
- Design clear interfaces between chain steps with well-defined contracts
- Implement error handling and fallback mechanisms at each step
- Use context management to maintain relevant information
- Validate intermediate results before proceeding
- Make chains modular and reusable

**When to Use**
- Tasks cleanly divisible into discrete, well-ordered subtasks
- Workflows needing intermediate validation or human oversight
- Processes benefiting from specialized prompts
- Scenarios requiring dynamic branching based on results

**Performance Impact**
- Up to 15.6% better accuracy than monolithic prompts
- Trades latency for accuracy by reducing cognitive load per step

**Example Use Case**
Booking application: Extract Entity (dates/destination) → Check Availability (query database) → Confirm & Book (present options and finalize)

---

### Routing

**What It Is**
- Directs requests to specialized agents/components based on intent
- Introduces specialization - each handler focuses on specific domain
- Improves precision across multi-domain systems

**How It Works**
1. Routing agent examines input request
2. Agent classifies request by intent, domain, or task type
3. Request is directed to appropriate specialized handler
4. Specialized handler processes request
5. Result is returned to user

**Specialization Patterns**
- By intent (billing, technical support, escalation)
- By domain (sales, engineering, marketing)
- By tool type (web search, calculator, code interpreter)
- By knowledge source (technical KB, user DB, general LLM)

**Implementation Approach**
- Create classification prompt that identifies routing dimension
- Implement conditional logic or dictionary-based routing
- Ensure each specialized handler has appropriate system prompt
- Include fallback routing for ambiguous cases
- Monitor routing accuracy and adjust classification rules

**When to Use**
- Multi-domain systems with different expertise areas
- Customer support with different department specialties
- Tools requiring selection from multiple options
- Question-answering across diverse knowledge bases

---

### Parallelization

**What It Is**
- Executes independent subtasks simultaneously
- Combines results from parallel execution
- Reduces total latency for independent operations

**How It Works**
1. Agent identifies subtasks that can run in parallel
2. Agent launches all parallel tasks concurrently
3. System waits for all tasks to complete
4. Results are combined and processed

**Implementation Approach**
- Use async/await with asyncio.gather() for concurrent execution
- Identify task dependencies first (only parallelize independent tasks)
- Aggregate results after all tasks complete
- Implement error handling for individual task failures
- Set reasonable timeouts for parallel tasks

**When to Use**
- Querying multiple sources for information
- Exploring different perspectives on same problem
- Independent analysis that can run concurrently
- Reducing overall workflow latency
- Parallel research or data gathering

---

### Evaluator-Optimizer Loop

**What It Is**
- Pairs generator with evaluator agent
- Generator produces output, evaluator assesses it
- Feedback drives iteration until quality threshold met
- More sophisticated than simple reflection

**How It Works**
1. Generator agent produces initial output/solution
2. Evaluator agent assesses output against criteria
3. Evaluator provides structured feedback
4. Generator refines output based on feedback
5. Cycle repeats until evaluator approves or limit reached

**Implementation Components**
- **Generation task**: Produces initial result (required)
- **Evaluation task**: Critiques result and provides feedback (optional but recommended)
- **Optimization task**: Refines based on feedback (optional)
- Can repeat evaluation-optimization cycle multiple times
- Can use different models for generation and evaluation

**Model Selection Strategy**
- Use stronger/slower model for generation (GPT-4)
- Use faster model for evaluation (Claude, DeepSeek)
- Or reverse depending on task requirements
- Different model pairs for different optimization dimensions

**Practical Applications**
- Code generation with execution feedback
- Writing/content refinement (clarity, tone, completeness)
- Complex problem solving (plan feasibility evaluation)
- Design optimization (quality assessment feedback)

**Cost Considerations**
- Multi-agent loops are expensive
- Each agent call consumes tokens
- Each coordination message adds cost
- Need to balance quality improvement vs. token spend

---

## Implementation Framework

### Recommended Frameworks

**LangGraph**
- Built-in support for agentic patterns
- `create_react_agent` function for ReAct architecture
- Graph-based workflow representation
- Streaming and async support

**AutoGen**
- Multi-agent orchestration
- Conversation-based coordination
- Built-in tool use patterns
- Cost optimization features

**CrewAI**
- Role-based agent specialization
- Task-oriented orchestration
- Built-in collaboration patterns
- Web integration

**Other Options**
- DSPy (ReAct via DSPy framework)
- Smolagents (HuggingFace - code agents based on ReAct)
- PraisonAI (evaluator-optimizer patterns)

### Key Implementation Principles

1. **Clear Separation of Concerns** - Each agent/step has distinct responsibility
2. **Well-Defined Interfaces** - Clear contracts between components
3. **Error Handling** - Robust handling at each step/agent
4. **Context Management** - Proper information flow across steps
5. **Monitoring & Observability** - Track performance and issues
6. **Cost Awareness** - Monitor token spend and optimize
7. **Modularity** - Make patterns reusable across workflows

---

## Pattern Selection Guide

| Pattern | Best For | Complexity | Cost | Latency |
|---------|----------|-----------|------|---------|
| Reflection | Quality improvement, code generation | Low-Medium | Medium | +Multiple turns |
| Tool Use | Real-world actions, data gathering | Medium | Medium | +API calls |
| Planning | Complex multi-step tasks | High | Medium | +Planning step |
| Multi-Agent | Diverse expertise needed | High | High | Medium |
| Prompt Chaining | Sequential well-defined tasks | Low | Low | Medium |
| Routing | Multi-domain systems | Low | Low | Fast |
| Parallelization | Independent operations | Medium | Medium | Reduced |
| Evaluator-Optimizer | High quality requirements | High | High | +Eval cycles |

---

## Key Insights

### When Patterns Work Best
- Patterns represent probabilistic improvements (not guarantees)
- Combining multiple patterns is more effective than single pattern
- Production systems typically use 2-3 patterns together
- Pattern effectiveness depends on task specifics

### Common Implementation Mistakes
- Creating overly complex chains that could be simplified
- Poor context management losing information across steps
- Insufficient error handling causing cascading failures
- Ignoring latency and cost implications
- Tight coupling between components making them brittle
- Overusing multi-agent patterns for simple tasks

### Quality Improvements Documented
- Reflection: 15.6% accuracy improvement
- Prompt Chaining: Better than monolithic approaches
- Tool Use: Enables new capabilities impossible with text alone
- Planning: Reduces errors in complex workflows
- Evaluator-Optimizer: Iterative quality improvement

---

## Learning Resources

- **Course**: [Agentic AI - Andrew Ng (DeepLearning.AI)](https://learn.deeplearning.ai/courses/agentic-ai/)
- **Book**: [Agentic Design Patterns - Antonio Gulli & Mauro Sauco](https://github.com/Mathews-Tom/Agentic-Design-Patterns)
- **Hands-on**: [Learn Agentic Patterns - Practical Exercises](https://practice.learnagenticpatterns.com/)
- **AWS Guide**: [Agentic AI Patterns - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/)
- **ByteByteGo**: [Top AI Agentic Workflow Patterns](https://blog.bytebytego.com/p/top-ai-agentic-workflow-patterns)
- **GitHub Implementations**: [josephsenior/Agentic-Design-Patterns](https://github.com/josephsenior/Agentic-Design-Patterns)

---

## Research Date
March 27, 2026

## Sources Referenced
- Andrew Ng's Agentic AI course (DeepLearning.AI)
- Mathews-Tom/Agentic-Design-Patterns GitHub repository
- AWS Prescriptive Guidance on Agentic AI Patterns
- Towards Data Science articles on agentic patterns
- Multiple implementation guides and tutorials
