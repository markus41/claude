"""
Example Usage of Exec-Automator MCP Server

Demonstrates how to use the MCP server tools programmatically.

Note: This is for illustration purposes. In practice, tools are called
via MCP protocol from Claude Code or other MCP clients.

Author: Brookside BI
"""

import asyncio
import json
from pathlib import Path


async def example_document_analysis():
    """
    Example: Analyze an RFP document.
    """
    print("=" * 80)
    print("EXAMPLE 1: Document Analysis")
    print("=" * 80)

    # Step 1: Analyze document
    print("\n1. Analyzing RFP document...")

    analyze_result = {
        "analysis_id": "analysis_20231217_120000",
        "document_path": "/path/to/executive_director_rfp.pdf",
        "document_type": "rfp",
        "organization": {
            "name": "National Widget Association",
            "type": "trade_association",
            "industry": ["manufacturing", "widgets"],
            "geographic_scope": "national",
            "budget_range": "2m_10m",
            "staff_count": 8
        },
        "responsibilities_count": 47,
        "status": "completed"
    }

    print(f"   ✓ Analysis complete: {analyze_result['analysis_id']}")
    print(f"   ✓ Organization: {analyze_result['organization']['name']}")
    print(f"   ✓ Responsibilities extracted: {analyze_result['responsibilities_count']}")

    # Step 2: Map responsibilities
    print("\n2. Mapping responsibilities by category...")

    map_result = {
        "analysis_id": "analysis_20231217_120000",
        "total_responsibilities": 47,
        "by_category": {
            "FINANCIAL": {"count": 8},
            "GOVERNANCE": {"count": 6},
            "OPERATIONS": {"count": 9},
            "STRATEGIC": {"count": 5},
            "COMMUNICATIONS": {"count": 7},
            "MEMBERSHIP": {"count": 6},
            "PROGRAMS": {"count": 4},
            "STAFF": {"count": 2}
        }
    }

    print("   ✓ Responsibilities by category:")
    for cat, info in map_result["by_category"].items():
        print(f"      - {cat}: {info['count']}")

    # Step 3: Score automation potential
    print("\n3. Scoring automation potential...")

    score_result = {
        "analysis_id": "analysis_20231217_120000",
        "total_responsibilities": 47,
        "average_automation_score": 58.3,
        "high_priority_count": 18,
        "estimated_weekly_time_savings_hours": 22.5,
        "high_priority_opportunities": [
            {
                "id": "resp_001",
                "raw_text": "Prepare monthly financial reports for board",
                "automation_score": 85,
                "automation_approach": "Full Automation",
                "estimated_time_savings_hours": 3.0
            },
            {
                "id": "resp_002",
                "raw_text": "Coordinate board meeting materials and distribution",
                "automation_score": 78,
                "automation_approach": "Full Automation",
                "estimated_time_savings_hours": 4.0
            },
            {
                "id": "resp_003",
                "raw_text": "Track and report membership statistics",
                "automation_score": 82,
                "automation_approach": "Full Automation",
                "estimated_time_savings_hours": 2.5
            }
        ]
    }

    print(f"   ✓ Average automation score: {score_result['average_automation_score']}/100")
    print(f"   ✓ High-priority opportunities: {score_result['high_priority_count']}")
    print(f"   ✓ Estimated weekly time savings: {score_result['estimated_weekly_time_savings_hours']} hours")
    print("\n   Top 3 automation opportunities:")
    for opp in score_result["high_priority_opportunities"][:3]:
        print(f"      - {opp['raw_text']}")
        print(f"        Score: {opp['automation_score']}/100 | Approach: {opp['automation_approach']}")
        print(f"        Time savings: {opp['estimated_time_savings_hours']} hours/week")


async def example_workflow_generation():
    """
    Example: Generate workflow for a high-priority responsibility.
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 2: Workflow Generation")
    print("=" * 80)

    # Step 1: Generate workflow
    print("\n1. Generating workflow for 'Prepare monthly financial reports'...")

    generate_result = {
        "workflow_id": "workflow_gen_20231217_120500",
        "responsibility_id": "resp_001",
        "workflow_type": "human_in_loop",
        "specification": {
            "workflow_name": "Monthly Financial Report Generation",
            "state_schema": {
                "input_data": "dict",
                "report_draft": "dict",
                "human_approved": "bool",
                "final_report": "dict",
                "current_step": "str",
                "status": "str"
            },
            "nodes": [
                "gather_data",
                "generate_report",
                "human_review",
                "finalize_report",
                "distribute_report"
            ],
            "edges": [
                {"from": "gather_data", "to": "generate_report"},
                {"from": "generate_report", "to": "human_review"},
                {"from": "human_review", "to": "finalize_report", "condition": "approved"},
                {"from": "human_review", "to": "generate_report", "condition": "rejected"},
                {"from": "finalize_report", "to": "distribute_report"}
            ],
            "human_approval_gates": ["human_review"]
        },
        "deployment_ready": True
    }

    print(f"   ✓ Workflow generated: {generate_result['workflow_id']}")
    print(f"   ✓ Workflow type: {generate_result['workflow_type']}")
    print(f"   ✓ Nodes: {len(generate_result['specification']['nodes'])}")
    print(f"   ✓ Human approval gates: {generate_result['specification']['human_approval_gates']}")


async def example_deployment_and_execution():
    """
    Example: Deploy and execute a workflow.
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 3: Deployment and Execution")
    print("=" * 80)

    # Step 1: Deploy workflow
    print("\n1. Deploying workflow to production...")

    deploy_result = {
        "deployment_id": "deploy_20231217_120800",
        "workflow_id": "workflow_gen_20231217_120500",
        "environment": "production",
        "status": "completed",
        "endpoint": "https://production.example.com/workflow_gen_20231217_120500",
        "monitoring_url": "https://monitor.example.com/workflow_gen_20231217_120500"
    }

    print(f"   ✓ Deployment complete: {deploy_result['deployment_id']}")
    print(f"   ✓ Endpoint: {deploy_result['endpoint']}")
    print(f"   ✓ Monitoring: {deploy_result['monitoring_url']}")

    # Step 2: Execute workflow
    print("\n2. Executing workflow with input data...")

    execute_result = {
        "execution_id": "exec_20231217_121000",
        "workflow_id": "workflow_gen_20231217_120500",
        "status": "running",
        "started_at": "2023-12-17T12:10:00Z"
    }

    print(f"   ✓ Execution started: {execute_result['execution_id']}")
    print(f"   ✓ Status: {execute_result['status']}")

    # Step 3: Check status
    print("\n3. Checking workflow status...")

    await asyncio.sleep(1)  # Simulate processing time

    status_result = {
        "thread_id": "exec_20231217_121000",
        "status": "awaiting_human_review",
        "current_step": "human_review",
        "progress": 60,
        "started_at": "2023-12-17T12:10:00Z"
    }

    print(f"   ✓ Status: {status_result['status']}")
    print(f"   ✓ Current step: {status_result['current_step']}")
    print(f"   ✓ Progress: {status_result['progress']}%")
    print("   ⏸  Workflow paused for human review")

    # Step 4: Human approval
    print("\n4. Human reviews and approves report...")

    approve_result = {
        "thread_id": "exec_20231217_121000",
        "approved": True,
        "status": "running"
    }

    print(f"   ✓ Approval provided: {approve_result['approved']}")
    print(f"   ✓ Workflow resumed: {approve_result['status']}")

    await asyncio.sleep(1)  # Simulate completion

    # Step 5: Final status
    print("\n5. Checking final status...")

    final_status = {
        "thread_id": "exec_20231217_121000",
        "status": "completed",
        "current_step": "completed",
        "progress": 100,
        "started_at": "2023-12-17T12:10:00Z",
        "completed_at": "2023-12-17T12:12:00Z",
        "result": {
            "report_generated": True,
            "report_url": "https://reports.example.com/monthly_financial_2023_11.pdf",
            "distributed_to": ["board@example.com", "finance_committee@example.com"]
        }
    }

    print(f"   ✓ Status: {final_status['status']}")
    print(f"   ✓ Progress: {final_status['progress']}%")
    print(f"   ✓ Report URL: {final_status['result']['report_url']}")
    print(f"   ✓ Distributed to: {', '.join(final_status['result']['distributed_to'])}")
    print("\n   🎉 Workflow completed successfully!")


async def example_pattern_query():
    """
    Example: Query pattern library.
    """
    print("\n" + "=" * 80)
    print("EXAMPLE 4: Pattern Library Query")
    print("=" * 80)

    print("\n1. Querying patterns for 'budget management'...")

    query_result = {
        "query": "budget management",
        "patterns": [
            {
                "pattern_id": "fin_001",
                "category": "FINANCIAL",
                "description": "Budget development and management",
                "automation_potential": 65,
                "automation_opportunities": [
                    "Automated budget template generation",
                    "Variance tracking and alerts",
                    "Monthly report generation"
                ]
            }
        ],
        "count": 1
    }

    print(f"   ✓ Found {query_result['count']} matching pattern(s)")
    for pattern in query_result["patterns"]:
        print(f"\n   Pattern: {pattern['description']}")
        print(f"   Category: {pattern['category']}")
        print(f"   Automation potential: {pattern['automation_potential']}/100")
        print(f"   Opportunities:")
        for opp in pattern["automation_opportunities"]:
            print(f"      - {opp}")


async def main():
    """
    Run all examples.
    """
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "EXEC-AUTOMATOR MCP SERVER EXAMPLES" + " " * 24 + "║")
    print("╚" + "=" * 78 + "╝")

    await example_document_analysis()
    await example_workflow_generation()
    await example_deployment_and_execution()
    await example_pattern_query()

    print("\n" + "=" * 80)
    print("Examples complete!")
    print("=" * 80)
    print("\nNote: These are simulated examples. In production:")
    print("  - Tools are called via MCP protocol from Claude Code")
    print("  - Actual LLMs process documents and generate workflows")
    print("  - Real checkpointing persists state to SQLite")
    print("  - Human approval interrupts are handled asynchronously")
    print("\nFor more information, see README.md")
    print()


if __name__ == "__main__":
    asyncio.run(main())
