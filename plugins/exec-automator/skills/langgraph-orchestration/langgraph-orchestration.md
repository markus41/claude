---
name: langgraph-orchestration
description: Expert knowledge in LangGraph StateGraph workflows, checkpointing, and agent orchestration patterns for building robust multi-agent systems
triggers:
  - langgraph
  - stategraph
  - workflow
  - graph
  - nodes
  - edges
  - checkpoint
  - state management
  - conditional routing
  - parallel execution
  - subgraph
  - graph compilation
  - workflow orchestration
tags:
  - langgraph
  - workflows
  - orchestration
  - state-management
  - multi-agent
color: "#8B5CF6"
---

# LangGraph Orchestration Skill

**Executive Summary**
This skill provides comprehensive expertise in LangGraph StateGraph workflows, enabling sophisticated agent orchestration patterns with state management, conditional routing, parallel execution, and human-in-the-loop integration. LangGraph is the industry-standard framework for building stateful, multi-agent workflows with built-in checkpointing and memory.

**Brand Voice:** Brookside BI - Direct, efficient, action-oriented automation expertise.

---

## Core Concepts

### StateGraph Architecture

LangGraph workflows are built on **StateGraph** - a directed graph where:
- **Nodes** represent computation units (functions, agents, tools)
- **Edges** define the flow between nodes
- **State** is a shared TypedDict passed through all nodes
- **Checkpoints** enable persistence and recovery

**Key Principles:**
1. **Immutable state updates** - Nodes return partial state updates
2. **Type-safe schemas** - TypedDict enforces state structure
3. **Declarative routing** - Conditional edges based on state
4. **Composable graphs** - Subgraphs as reusable components

---

## 1. State Schema Design

### Basic State Schema

```python
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """Core state schema for agent workflows."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next_step: str
    iteration: int
    error: str | None
```

### Advanced Multi-Agent State

```python
from typing import Literal, Any
from datetime import datetime

class ExecutiveState(TypedDict):
    """Executive director workflow state."""
    # Message history
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Workflow control
    current_phase: Literal["intake", "planning", "execution", "review", "complete"]
    next_agent: str
    iteration: int
    max_iterations: int

    # Task context
    objective: str
    plan: list[dict[str, Any]]
    completed_tasks: list[str]
    pending_tasks: list[str]

    # Results and feedback
    results: dict[str, Any]
    feedback: str | None
    approval_required: bool

    # Error handling
    error: str | None
    retry_count: int

    # Metadata
    session_id: str
    started_at: datetime
    updated_at: datetime
```

### State Reducers

```python
from operator import add

class CollaborativeState(TypedDict):
    """State with custom reducers for collaborative workflows."""
    # Append-only message list
    messages: Annotated[list[BaseMessage], add_messages]

    # Accumulate insights from multiple agents
    insights: Annotated[list[str], add]

    # Merge dictionaries from parallel branches
    analysis: Annotated[dict[str, Any], lambda x, y: {**x, **y}]

    # Custom reducer for consensus
    votes: Annotated[dict[str, int], lambda x, y: {
        k: x.get(k, 0) + y.get(k, 0) for k in set(x) | set(y)
    }]
```

---

## 2. Node Function Patterns

### Basic Node Function

```python
from langchain_core.runnables import RunnableConfig

def planning_node(state: AgentState, config: RunnableConfig) -> dict:
    """Planning node that generates execution plan."""
    messages = state["messages"]
    objective = messages[-1].content

    # Generate plan using LLM
    planner = get_planner_llm()
    plan = planner.invoke(f"Create plan for: {objective}")

    return {
        "messages": [AIMessage(content=f"Plan: {plan}")],
        "next_step": "execute",
        "iteration": state["iteration"] + 1
    }
```

### Agent Node with Tool Calling

```python
from langchain_core.messages import ToolMessage

def agent_node(state: AgentState, config: RunnableConfig) -> dict:
    """Agent node with tool execution."""
    messages = state["messages"]

    # Bind tools to agent
    agent = get_agent_llm().bind_tools(get_tools())
    response = agent.invoke(messages)

    # Execute tool calls if present
    if response.tool_calls:
        tool_messages = []
        for tool_call in response.tool_calls:
            tool = get_tool(tool_call["name"])
            result = tool.invoke(tool_call["args"])
            tool_messages.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=tool_call["id"]
                )
            )
        return {
            "messages": [response] + tool_messages,
            "next_step": "agent"  # Loop back to process tool results
        }

    return {
        "messages": [response],
        "next_step": "end"
    }
```

### Parallel Task Node

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parallel_analysis_node(state: ExecutiveState, config: RunnableConfig) -> dict:
    """Execute multiple analyses in parallel."""
    objective = state["objective"]

    # Define parallel tasks
    tasks = [
        analyze_market(objective),
        analyze_competitors(objective),
        analyze_risks(objective),
        analyze_opportunities(objective)
    ]

    # Execute in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate results
    analysis = {
        "market": results[0],
        "competitors": results[1],
        "risks": results[2],
        "opportunities": results[3]
    }

    return {
        "analysis": analysis,
        "current_phase": "execution",
        "messages": [AIMessage(content=f"Analysis complete: {len(results)} dimensions")]
    }
```

### Human-in-the-Loop Node

```python
from langgraph.checkpoint.memory import MemorySaver

def human_approval_node(state: ExecutiveState, config: RunnableConfig) -> dict:
    """Node that requires human approval before proceeding."""
    plan = state["plan"]

    # Check if approval already provided
    if state.get("feedback"):
        return {
            "approval_required": False,
            "current_phase": "execution"
        }

    # Request approval
    return {
        "approval_required": True,
        "messages": [
            AIMessage(content=f"Plan ready for review:\n{format_plan(plan)}\n\nApproval required.")
        ],
        "next_agent": "human"
    }
```

### Error Recovery Node

```python
def error_handler_node(state: ExecutiveState, config: RunnableConfig) -> dict:
    """Handle errors and determine recovery strategy."""
    error = state["error"]
    retry_count = state["retry_count"]
    max_retries = 3

    if retry_count >= max_retries:
        return {
            "current_phase": "complete",
            "messages": [AIMessage(content=f"Max retries exceeded: {error}")],
            "error": error
        }

    # Attempt recovery
    recovery_plan = generate_recovery_plan(error, state)

    return {
        "error": None,
        "retry_count": retry_count + 1,
        "plan": recovery_plan,
        "current_phase": "execution",
        "messages": [AIMessage(content=f"Recovering from error (attempt {retry_count + 1})")]
    }
```

---

## 3. Edge Routing Patterns

### Conditional Edge Routing

```python
def route_next_step(state: AgentState) -> str:
    """Determine next node based on state."""
    next_step = state.get("next_step", "end")

    # Route based on next_step field
    if next_step == "plan":
        return "planning"
    elif next_step == "execute":
        return "execution"
    elif next_step == "review":
        return "review"
    else:
        return "end"
```

### Complex Decision Routing

```python
def executive_router(state: ExecutiveState) -> str:
    """Advanced routing logic for executive workflow."""
    phase = state["current_phase"]
    error = state.get("error")
    approval_required = state.get("approval_required", False)
    iteration = state["iteration"]
    max_iterations = state["max_iterations"]

    # Error handling
    if error:
        return "error_handler"

    # Iteration limit
    if iteration >= max_iterations:
        return "complete"

    # Human approval gate
    if approval_required:
        return "await_approval"

    # Phase-based routing
    routing_map = {
        "intake": "planning",
        "planning": "execution",
        "execution": "review",
        "review": "quality_check",
        "complete": END
    }

    return routing_map.get(phase, END)
```

### Tool-Based Routing

```python
def tool_router(state: AgentState) -> str:
    """Route based on tool calls in last message."""
    last_message = state["messages"][-1]

    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return "agent"  # No tools, continue with agent

    # Route to specialized handler based on tool type
    tool_name = last_message.tool_calls[0]["name"]

    if tool_name.startswith("database_"):
        return "database_executor"
    elif tool_name.startswith("api_"):
        return "api_executor"
    elif tool_name.startswith("analysis_"):
        return "analysis_executor"
    else:
        return "general_tool_executor"
```

### Parallel Branch Routing

```python
from typing import Literal

def parallel_router(state: ExecutiveState) -> list[str]:
    """Route to multiple parallel branches."""
    objective_type = classify_objective(state["objective"])

    # Define parallel paths based on objective type
    if objective_type == "comprehensive":
        return ["market_analysis", "technical_analysis", "financial_analysis"]
    elif objective_type == "research":
        return ["data_gathering", "literature_review", "expert_consultation"]
    elif objective_type == "execution":
        return ["task_decomposition", "resource_allocation", "timeline_planning"]
    else:
        return ["general_planning"]
```

---

## 4. Graph Construction Patterns

### Basic Sequential Workflow

```python
from langgraph.graph import StateGraph, END

def create_basic_workflow() -> StateGraph:
    """Create simple sequential workflow."""
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("planning", planning_node)
    workflow.add_node("execution", execution_node)
    workflow.add_node("review", review_node)

    # Define edges
    workflow.set_entry_point("intake")
    workflow.add_edge("intake", "planning")
    workflow.add_edge("planning", "execution")
    workflow.add_edge("execution", "review")
    workflow.add_edge("review", END)

    return workflow
```

### Conditional Routing Workflow

```python
def create_conditional_workflow() -> StateGraph:
    """Workflow with conditional routing."""
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_executor_node)
    workflow.add_node("summarize", summarize_node)

    # Entry point
    workflow.set_entry_point("agent")

    # Conditional edges
    workflow.add_conditional_edges(
        "agent",
        route_next_step,
        {
            "tools": "tools",
            "summarize": "summarize",
            "end": END
        }
    )

    # Loop back for tool execution
    workflow.add_edge("tools", "agent")
    workflow.add_edge("summarize", END)

    return workflow
```

### Parallel Execution Workflow

```python
from langgraph.graph import Send

def create_parallel_workflow() -> StateGraph:
    """Workflow with parallel execution branches."""
    workflow = StateGraph(ExecutiveState)

    # Add nodes
    workflow.add_node("dispatcher", dispatch_node)
    workflow.add_node("market_analysis", market_analysis_node)
    workflow.add_node("competitor_analysis", competitor_analysis_node)
    workflow.add_node("risk_analysis", risk_analysis_node)
    workflow.add_node("aggregator", aggregator_node)

    # Entry point
    workflow.set_entry_point("dispatcher")

    # Fan-out to parallel branches
    workflow.add_conditional_edges(
        "dispatcher",
        lambda state: [
            Send("market_analysis", state),
            Send("competitor_analysis", state),
            Send("risk_analysis", state)
        ]
    )

    # Fan-in to aggregator
    workflow.add_edge("market_analysis", "aggregator")
    workflow.add_edge("competitor_analysis", "aggregator")
    workflow.add_edge("risk_analysis", "aggregator")
    workflow.add_edge("aggregator", END)

    return workflow
```

### Subgraph Composition

```python
def create_analysis_subgraph() -> StateGraph:
    """Reusable analysis subgraph."""
    subgraph = StateGraph(AgentState)

    subgraph.add_node("gather_data", gather_data_node)
    subgraph.add_node("analyze", analyze_node)
    subgraph.add_node("report", report_node)

    subgraph.set_entry_point("gather_data")
    subgraph.add_edge("gather_data", "analyze")
    subgraph.add_edge("analyze", "report")
    subgraph.add_edge("report", END)

    return subgraph

def create_master_workflow() -> StateGraph:
    """Master workflow incorporating subgraphs."""
    workflow = StateGraph(ExecutiveState)

    # Add regular nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("planning", planning_node)

    # Add subgraph as node
    analysis_graph = create_analysis_subgraph().compile()
    workflow.add_node("analysis", analysis_graph)

    workflow.add_node("execution", execution_node)

    # Define flow
    workflow.set_entry_point("intake")
    workflow.add_edge("intake", "planning")
    workflow.add_edge("planning", "analysis")
    workflow.add_edge("analysis", "execution")
    workflow.add_edge("execution", END)

    return workflow
```

### Human-in-the-Loop Workflow

```python
from langgraph.checkpoint.memory import MemorySaver

def create_hitl_workflow() -> StateGraph:
    """Workflow with human-in-the-loop approval gates."""
    workflow = StateGraph(ExecutiveState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("await_approval", human_approval_node)
    workflow.add_node("executor", executor_node)
    workflow.add_node("reviewer", reviewer_node)

    # Entry point
    workflow.set_entry_point("planner")

    # Conditional routing for approval
    workflow.add_conditional_edges(
        "planner",
        lambda state: "await_approval" if state.get("approval_required") else "executor"
    )

    # Human can approve or reject
    workflow.add_conditional_edges(
        "await_approval",
        lambda state: "executor" if state.get("feedback") == "approved" else "planner",
        {
            "executor": "executor",
            "planner": "planner"  # Loop back for revision
        }
    )

    workflow.add_edge("executor", "reviewer")
    workflow.add_edge("reviewer", END)

    # Compile with checkpointing for interruptions
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory, interrupt_before=["await_approval"])
```

---

## 5. Checkpointing and Persistence

### Basic Checkpointing

```python
from langgraph.checkpoint.memory import MemorySaver

def create_checkpointed_workflow() -> CompiledGraph:
    """Workflow with in-memory checkpointing."""
    workflow = StateGraph(AgentState)

    # Build workflow...
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)

    # Compile with checkpointing
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

# Usage
app = create_checkpointed_workflow()
config = {"configurable": {"thread_id": "session-123"}}

# First run
result = app.invoke({"messages": [HumanMessage(content="Start task")]}, config)

# Resume from checkpoint
result = app.invoke({"messages": [HumanMessage(content="Continue")]}, config)
```

### SQLite Checkpointing

```python
from langgraph.checkpoint.sqlite import SqliteSaver

def create_persistent_workflow() -> CompiledGraph:
    """Workflow with SQLite persistence."""
    workflow = StateGraph(ExecutiveState)

    # Build workflow...
    # (nodes and edges)

    # Compile with SQLite checkpointing
    with SqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
        return workflow.compile(checkpointer=checkpointer)

# Usage with persistent sessions
app = create_persistent_workflow()
config = {
    "configurable": {
        "thread_id": "exec-session-456",
        "checkpoint_ns": "executive"
    }
}

# Run persists to database
result = app.invoke(initial_state, config)

# Later: Resume from database
resumed = app.invoke(continuation_state, config)
```

### Checkpoint Inspection

```python
def inspect_checkpoints(app: CompiledGraph, thread_id: str):
    """Inspect checkpoint history for debugging."""
    config = {"configurable": {"thread_id": thread_id}}

    # Get checkpoint history
    checkpoints = list(app.get_state_history(config))

    for checkpoint in checkpoints:
        print(f"Checkpoint: {checkpoint.checkpoint_id}")
        print(f"  Timestamp: {checkpoint.created_at}")
        print(f"  State: {checkpoint.values}")
        print(f"  Next: {checkpoint.next}")
        print(f"  Metadata: {checkpoint.metadata}")
        print("---")

    return checkpoints

# Get specific checkpoint
def get_checkpoint_state(app: CompiledGraph, thread_id: str, checkpoint_id: str):
    """Retrieve specific checkpoint state."""
    config = {
        "configurable": {
            "thread_id": thread_id,
            "checkpoint_id": checkpoint_id
        }
    }
    return app.get_state(config)
```

### Manual Checkpointing

```python
def create_manual_checkpoint_workflow() -> CompiledGraph:
    """Workflow with manual checkpoint control."""
    workflow = StateGraph(ExecutiveState)

    workflow.add_node("step1", step1_node)
    workflow.add_node("checkpoint_gate", checkpoint_gate_node)
    workflow.add_node("step2", step2_node)

    workflow.set_entry_point("step1")
    workflow.add_edge("step1", "checkpoint_gate")
    workflow.add_edge("checkpoint_gate", "step2")
    workflow.add_edge("step2", END)

    # Compile with interrupt before checkpoint gate
    memory = MemorySaver()
    return workflow.compile(
        checkpointer=memory,
        interrupt_before=["checkpoint_gate"]
    )

# Usage: Manually resume after interrupt
app = create_manual_checkpoint_workflow()
config = {"configurable": {"thread_id": "manual-123"}}

# Run until interrupt
result = app.invoke(initial_state, config)
# Workflow pauses at checkpoint_gate

# Inspect state
state = app.get_state(config)
print(f"Paused at: {state.next}")  # ['checkpoint_gate']

# Resume execution
result = app.invoke(None, config)  # None continues from checkpoint
```

---

## 6. Streaming and Real-Time Updates

### Stream Events

```python
async def stream_workflow_events(app: CompiledGraph, initial_state: dict, config: dict):
    """Stream workflow events in real-time."""
    async for event in app.astream_events(initial_state, config, version="v2"):
        kind = event["event"]

        if kind == "on_chain_start":
            print(f"Starting: {event['name']}")

        elif kind == "on_chain_end":
            print(f"Finished: {event['name']}")
            print(f"  Output: {event['data']['output']}")

        elif kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content
            if content:
                print(content, end="", flush=True)

        elif kind == "on_tool_start":
            print(f"Tool: {event['name']}")
            print(f"  Input: {event['data']['input']}")

        elif kind == "on_tool_end":
            print(f"  Output: {event['data']['output']}")
```

### Stream Node Updates

```python
def stream_node_updates(app: CompiledGraph, initial_state: dict, config: dict):
    """Stream state updates from each node."""
    for output in app.stream(initial_state, config, stream_mode="updates"):
        for node_name, node_output in output.items():
            print(f"Node: {node_name}")
            print(f"  Update: {node_output}")
            print("---")
```

### Stream Complete States

```python
def stream_full_states(app: CompiledGraph, initial_state: dict, config: dict):
    """Stream complete state after each node."""
    for state_snapshot in app.stream(initial_state, config, stream_mode="values"):
        print(f"Current State:")
        print(f"  Phase: {state_snapshot.get('current_phase')}")
        print(f"  Messages: {len(state_snapshot.get('messages', []))}")
        print(f"  Iteration: {state_snapshot.get('iteration')}")
        print("---")
```

### Real-Time UI Updates

```python
import asyncio
from typing import AsyncIterator

async def stream_to_ui(
    app: CompiledGraph,
    initial_state: dict,
    config: dict
) -> AsyncIterator[dict]:
    """Stream workflow updates for UI consumption."""
    async for event in app.astream_events(initial_state, config, version="v2"):
        ui_event = {
            "timestamp": event.get("timestamp"),
            "type": event["event"],
            "data": {}
        }

        if event["event"] == "on_chat_model_stream":
            ui_event["data"] = {
                "type": "llm_token",
                "content": event["data"]["chunk"].content
            }

        elif event["event"] == "on_chain_start":
            ui_event["data"] = {
                "type": "node_start",
                "node": event["name"]
            }

        elif event["event"] == "on_chain_end":
            ui_event["data"] = {
                "type": "node_complete",
                "node": event["name"],
                "output": event["data"]["output"]
            }

        yield ui_event

# Usage in FastAPI endpoint
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app_web = FastAPI()

@app_web.post("/workflow/stream")
async def stream_workflow(request: dict):
    workflow = create_workflow()
    config = {"configurable": {"thread_id": request["session_id"]}}

    async def event_generator():
        async for event in stream_to_ui(workflow, request["state"], config):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

## 7. Error Handling Patterns

### Try-Catch in Nodes

```python
def resilient_node(state: AgentState, config: RunnableConfig) -> dict:
    """Node with comprehensive error handling."""
    try:
        # Main logic
        result = perform_operation(state)

        return {
            "messages": [AIMessage(content=f"Success: {result}")],
            "error": None,
            "next_step": "continue"
        }

    except ValidationError as e:
        return {
            "error": f"Validation failed: {str(e)}",
            "next_step": "retry",
            "messages": [AIMessage(content=f"Validation error: {e}")]
        }

    except ExternalAPIError as e:
        return {
            "error": f"API error: {str(e)}",
            "next_step": "fallback",
            "retry_count": state.get("retry_count", 0) + 1,
            "messages": [AIMessage(content=f"API unavailable: {e}")]
        }

    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "next_step": "error_handler",
            "messages": [AIMessage(content=f"Critical error: {e}")]
        }
```

### Retry Logic with Backoff

```python
import time
from functools import wraps

def retry_with_backoff(max_retries: int = 3, backoff_factor: float = 2.0):
    """Decorator for retry logic with exponential backoff."""
    def decorator(func):
        @wraps(func)
        def wrapper(state: AgentState, config: RunnableConfig) -> dict:
            retry_count = state.get("retry_count", 0)

            for attempt in range(max_retries):
                try:
                    result = func(state, config)
                    return {
                        **result,
                        "retry_count": 0,  # Reset on success
                        "error": None
                    }
                except Exception as e:
                    if attempt == max_retries - 1:
                        return {
                            "error": f"Max retries exceeded: {str(e)}",
                            "retry_count": retry_count + max_retries,
                            "next_step": "error_handler",
                            "messages": [AIMessage(content=f"Failed after {max_retries} attempts")]
                        }

                    # Exponential backoff
                    sleep_time = backoff_factor ** attempt
                    time.sleep(sleep_time)

        return wrapper
    return decorator

@retry_with_backoff(max_retries=3, backoff_factor=2.0)
def api_call_node(state: AgentState, config: RunnableConfig) -> dict:
    """Node with automatic retry logic."""
    result = call_external_api(state["query"])
    return {
        "messages": [AIMessage(content=str(result))],
        "next_step": "process_result"
    }
```

### Circuit Breaker Pattern

```python
from datetime import datetime, timedelta

class CircuitBreaker:
    """Circuit breaker for failing services."""
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        if self.state == "open":
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout):
                self.state = "half-open"
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e

    def on_success(self):
        self.failure_count = 0
        self.state = "closed"

    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

# Usage in node
api_breaker = CircuitBreaker(failure_threshold=5, timeout=60)

def protected_api_node(state: AgentState, config: RunnableConfig) -> dict:
    """Node protected by circuit breaker."""
    try:
        result = api_breaker.call(call_external_api, state["query"])
        return {
            "messages": [AIMessage(content=str(result))],
            "error": None
        }
    except Exception as e:
        return {
            "error": f"Circuit breaker triggered: {str(e)}",
            "next_step": "fallback",
            "messages": [AIMessage(content="Service temporarily unavailable")]
        }
```

---

## 8. Advanced Patterns

### Dynamic Graph Construction

```python
def create_dynamic_workflow(objective_type: str) -> StateGraph:
    """Build graph dynamically based on requirements."""
    workflow = StateGraph(ExecutiveState)

    # Always include core nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("planning", planning_node)

    # Conditionally add specialized nodes
    if objective_type == "data_analysis":
        workflow.add_node("data_ingestion", data_ingestion_node)
        workflow.add_node("statistical_analysis", statistical_analysis_node)
        workflow.add_node("visualization", visualization_node)

    elif objective_type == "software_development":
        workflow.add_node("requirements_analysis", requirements_node)
        workflow.add_node("architecture_design", architecture_node)
        workflow.add_node("code_generation", code_generation_node)
        workflow.add_node("testing", testing_node)

    elif objective_type == "research":
        workflow.add_node("literature_review", literature_review_node)
        workflow.add_node("hypothesis_generation", hypothesis_node)
        workflow.add_node("experiment_design", experiment_design_node)

    # Always end with review
    workflow.add_node("review", review_node)

    # Build edges based on added nodes
    build_edges_for_type(workflow, objective_type)

    return workflow
```

### Map-Reduce Pattern

```python
from typing import List

def map_reduce_workflow() -> StateGraph:
    """Map-reduce pattern for parallel processing."""
    workflow = StateGraph(ExecutiveState)

    def map_node(state: ExecutiveState, config: RunnableConfig) -> dict:
        """Split work into parallel chunks."""
        tasks = state["pending_tasks"]

        # Create parallel sends
        return {
            "map_results": [],
            "pending_tasks": tasks
        }

    def worker_node(state: ExecutiveState, config: RunnableConfig) -> dict:
        """Process individual task."""
        task = state["current_task"]
        result = process_task(task)

        return {
            "map_results": [result],
            "completed_tasks": [task]
        }

    def reduce_node(state: ExecutiveState, config: RunnableConfig) -> dict:
        """Aggregate results from parallel workers."""
        results = state["map_results"]

        # Combine results
        final_result = aggregate_results(results)

        return {
            "results": {"final": final_result},
            "current_phase": "complete",
            "messages": [AIMessage(content=f"Processed {len(results)} tasks")]
        }

    workflow.add_node("map", map_node)
    workflow.add_node("worker", worker_node)
    workflow.add_node("reduce", reduce_node)

    workflow.set_entry_point("map")

    # Fan-out to workers
    workflow.add_conditional_edges(
        "map",
        lambda state: [Send("worker", {**state, "current_task": task})
                      for task in state["pending_tasks"]]
    )

    # Fan-in to reduce
    workflow.add_edge("worker", "reduce")
    workflow.add_edge("reduce", END)

    return workflow
```

### Self-Correcting Agent Loop

```python
def self_correcting_workflow() -> StateGraph:
    """Agent that validates and corrects its own output."""
    workflow = StateGraph(AgentState)

    def generator_node(state: AgentState, config: RunnableConfig) -> dict:
        """Generate initial solution."""
        llm = get_llm()
        solution = llm.invoke(state["messages"])

        return {
            "messages": [solution],
            "solution": solution.content,
            "validation_passed": False
        }

    def validator_node(state: AgentState, config: RunnableConfig) -> dict:
        """Validate the generated solution."""
        solution = state["solution"]
        validator_llm = get_llm()

        validation_prompt = f"""
        Validate this solution:
        {solution}

        Check for:
        1. Correctness
        2. Completeness
        3. Best practices

        Return VALID or list issues.
        """

        validation = validator_llm.invoke(validation_prompt)
        is_valid = "VALID" in validation.content

        return {
            "validation_passed": is_valid,
            "validation_feedback": validation.content,
            "iteration": state.get("iteration", 0) + 1
        }

    def corrector_node(state: AgentState, config: RunnableConfig) -> dict:
        """Correct the solution based on feedback."""
        solution = state["solution"]
        feedback = state["validation_feedback"]

        corrector_llm = get_llm()
        corrected = corrector_llm.invoke(f"""
        Original solution:
        {solution}

        Issues found:
        {feedback}

        Provide corrected solution.
        """)

        return {
            "messages": [corrected],
            "solution": corrected.content
        }

    workflow.add_node("generator", generator_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("corrector", corrector_node)

    workflow.set_entry_point("generator")
    workflow.add_edge("generator", "validator")

    # Loop back if validation fails
    workflow.add_conditional_edges(
        "validator",
        lambda state: "complete" if state["validation_passed"] or state.get("iteration", 0) >= 3 else "corrector",
        {
            "corrector": "corrector",
            "complete": END
        }
    )

    workflow.add_edge("corrector", "validator")

    return workflow
```

---

## 9. Integration Patterns

### LangChain Tool Integration

```python
from langchain.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun

def create_tool_integrated_workflow() -> StateGraph:
    """Workflow with LangChain tool integration."""
    workflow = StateGraph(AgentState)

    # Define tools
    search = DuckDuckGoSearchRun()
    calculator = Tool(
        name="Calculator",
        func=lambda x: eval(x),
        description="Perform calculations"
    )

    tools = [search, calculator]

    def tool_calling_agent(state: AgentState, config: RunnableConfig) -> dict:
        """Agent that can use tools."""
        llm = get_llm().bind_tools(tools)
        response = llm.invoke(state["messages"])

        return {"messages": [response]}

    def tool_executor(state: AgentState, config: RunnableConfig) -> dict:
        """Execute tool calls."""
        last_message = state["messages"][-1]
        tool_messages = []

        for tool_call in last_message.tool_calls:
            # Find and execute tool
            tool = next(t for t in tools if t.name == tool_call["name"])
            result = tool.invoke(tool_call["args"])

            tool_messages.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=tool_call["id"]
                )
            )

        return {"messages": tool_messages}

    workflow.add_node("agent", tool_calling_agent)
    workflow.add_node("tools", tool_executor)

    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        lambda state: "tools" if state["messages"][-1].tool_calls else END,
        {"tools": "tools", END: END}
    )
    workflow.add_edge("tools", "agent")

    return workflow
```

### Memory Integration

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import get_buffer_string

def create_memory_workflow() -> StateGraph:
    """Workflow with conversation memory."""
    workflow = StateGraph(AgentState)

    memory = ConversationBufferMemory(return_messages=True)

    def memory_node(state: AgentState, config: RunnableConfig) -> dict:
        """Load and update conversation memory."""
        # Load memory
        memory_vars = memory.load_memory_variables({})
        history = memory_vars.get("history", [])

        # Add to state
        messages = history + state["messages"]

        # Save new messages to memory
        for msg in state["messages"]:
            memory.save_context(
                {"input": msg.content if hasattr(msg, "content") else str(msg)},
                {"output": ""}
            )

        return {"messages": messages}

    workflow.add_node("memory", memory_node)
    workflow.add_node("agent", agent_node)

    workflow.set_entry_point("memory")
    workflow.add_edge("memory", "agent")
    workflow.add_edge("agent", END)

    return workflow
```

---

## 10. Testing and Debugging

### Unit Testing Nodes

```python
import pytest
from langchain_core.messages import HumanMessage, AIMessage

def test_planning_node():
    """Test planning node in isolation."""
    state = {
        "messages": [HumanMessage(content="Build a web app")],
        "iteration": 0
    }

    result = planning_node(state, {})

    assert "messages" in result
    assert len(result["messages"]) > 0
    assert "next_step" in result
    assert result["next_step"] == "execute"

def test_conditional_routing():
    """Test routing logic."""
    state_to_plan = {"next_step": "plan", "iteration": 0}
    assert route_next_step(state_to_plan) == "planning"

    state_to_end = {"next_step": "complete", "iteration": 5}
    assert route_next_step(state_to_end) == "end"
```

### Integration Testing

```python
def test_full_workflow():
    """Test complete workflow execution."""
    workflow = create_basic_workflow()
    app = workflow.compile()

    initial_state = {
        "messages": [HumanMessage(content="Test task")],
        "iteration": 0
    }

    config = {"configurable": {"thread_id": "test-123"}}

    result = app.invoke(initial_state, config)

    assert result is not None
    assert "messages" in result
    assert len(result["messages"]) > 1
```

### Debug Tracing

```python
from langchain.callbacks import tracing_v2_enabled

def debug_workflow_execution():
    """Run workflow with detailed tracing."""
    app = create_workflow().compile()

    with tracing_v2_enabled(project_name="executive-automator"):
        result = app.invoke(
            {"messages": [HumanMessage(content="Debug test")]},
            {"configurable": {"thread_id": "debug-001"}}
        )

    return result
```

---

## Best Practices

### 1. State Design
- Keep state minimal and focused
- Use TypedDict for type safety
- Implement custom reducers for complex aggregations
- Separate workflow control from business data

### 2. Node Design
- Keep nodes focused on single responsibility
- Return partial state updates, not full state
- Handle errors gracefully within nodes
- Use async for I/O-bound operations

### 3. Routing Logic
- Make routing deterministic and testable
- Avoid complex logic in routing functions
- Use meaningful node names for clarity
- Document routing decisions

### 4. Error Handling
- Always include error state in schema
- Implement retry logic for transient failures
- Use circuit breakers for external services
- Provide clear error messages

### 5. Performance
- Use parallel execution where possible
- Stream results for long-running workflows
- Implement checkpointing for resumability
- Monitor and log execution metrics

### 6. Testing
- Test nodes in isolation
- Test routing logic separately
- Integration test complete workflows
- Use mocks for external dependencies

### 7. Production Readiness
- Use persistent checkpointing (SQLite, Postgres)
- Implement comprehensive logging
- Add monitoring and alerting
- Version your workflows

---

## Common Pitfalls

1. **Mutating State Directly** - Always return new state updates
2. **Missing Error Handlers** - Every workflow needs error handling
3. **No Checkpointing** - Long workflows need persistence
4. **Blocking I/O in Nodes** - Use async for external calls
5. **Tight Coupling** - Keep nodes reusable and independent
6. **No Testing** - Test nodes and routing logic thoroughly
7. **Missing Loop Protection** - Add iteration limits to prevent infinite loops

---

## Resources

- **LangGraph Documentation**: https://langchain-ai.github.io/langgraph/
- **LangChain Tools**: https://python.langchain.com/docs/modules/agents/tools/
- **Checkpointing Guide**: https://langchain-ai.github.io/langgraph/how-tos/persistence/
- **Streaming Guide**: https://langchain-ai.github.io/langgraph/how-tos/streaming/

---

**Skill Activation:** This skill activates when working with LangGraph workflows, StateGraph construction, agent orchestration, or multi-step AI workflows requiring state management and conditional routing.

**Maintained by:** Brookside BI - Executive Automation Division
