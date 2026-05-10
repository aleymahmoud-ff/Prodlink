# CLAUDE.md - AI Assistant Guide for ProdLink

This document provides guidance for AI assistants working with the ProdLink codebase.

## Project Overview

**ProdLink** is a new project repository. This CLAUDE.md serves as a foundational guide that should be updated as the project evolves.

**Repository:** aleymahmoud/prodlink
**Status:** Initial setup

## Repository Structure

```
prodlink/
├── CLAUDE.md          # This file - AI assistant guidelines
└── (project files to be added)
```

> **Note:** Update this section as the project structure develops.

## Development Environment

### Prerequisites

- To be defined based on project technology stack

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd prodlink

# Additional setup steps to be added
```

## Development Workflows

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features (if applicable)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `claude/*` - AI assistant work branches

### Commit Guidelines

Follow conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Pull Request Process

1. Create a feature/bugfix branch from the appropriate base
2. Make changes with clear, atomic commits
3. Ensure all tests pass (when tests exist)
4. Create a PR with a clear description
5. Address review feedback

## Code Conventions

### General Principles

1. **Simplicity** - Keep solutions simple and focused
2. **Readability** - Write clear, self-documenting code
3. **Consistency** - Follow established patterns in the codebase
4. **Security** - Never introduce vulnerabilities (see Security section)

### Style Guidelines

> **Note:** Update this section with language-specific style guides as the project develops.

## Testing

### Running Tests

```bash
# Add test commands as project develops
```

### Writing Tests

- Write tests for new functionality
- Maintain existing test coverage
- Follow testing patterns established in the codebase

## AI Assistant Guidelines

### Before Making Changes

1. **Read before modifying** - Always read files before suggesting changes
2. **Understand context** - Explore related files to understand patterns
3. **Check existing patterns** - Follow conventions already in the codebase

### When Implementing Features

1. Use the TodoWrite tool to plan and track tasks
2. Make minimal, focused changes
3. Avoid over-engineering
4. Don't add features beyond what was requested

### Code Quality

- Don't add unnecessary comments or documentation
- Don't refactor unrelated code
- Keep changes atomic and reviewable

### Security

Never introduce:
- Command injection vulnerabilities
- XSS vulnerabilities
- SQL injection
- Hardcoded secrets or credentials
- Other OWASP Top 10 vulnerabilities

### Git Operations

- Use clear, descriptive commit messages
- Never force push to shared branches
- Always verify changes before committing

## Common Tasks

### Adding a New Feature

1. Understand the requirements
2. Explore relevant existing code
3. Plan the implementation
4. Implement with minimal changes
5. Add tests if applicable
6. Commit with clear message

### Fixing a Bug

1. Reproduce and understand the bug
2. Find the root cause
3. Implement the minimal fix
4. Verify the fix
5. Commit with reference to issue if applicable

### Updating Documentation

- Keep documentation concise and accurate
- Update as code changes
- Don't add unnecessary documentation

## Project-Specific Notes

> Add project-specific information here as the project develops, such as:
> - API endpoints
> - Database schema
> - External service integrations
> - Environment variables
> - Deployment procedures

---

*This CLAUDE.md should be updated as the project evolves. Add new sections as needed and remove placeholder content when actual project details are available.*
