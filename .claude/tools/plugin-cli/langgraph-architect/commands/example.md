# Example Command

This command demonstrates how to create commands in the langgraph-architect plugin.

## Usage

```
/example [action]
```

## Actions

- `init` - Initialize example
- `run` - Run example
- `clean` - Clean up example

## Implementation

When this command is invoked:

1. Parse the action parameter
2. Execute the appropriate action
3. Provide feedback to the user

## Examples

```bash
# Initialize
/example init

# Run
/example run

# Clean
/example clean
```

## Output

The command will:
- Create necessary files
- Execute the requested action
- Report success or failure
