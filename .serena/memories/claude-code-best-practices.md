# Claude Code Best Practices Reference Guide

## 1. Project Setup and Organization

### CLAUDE.md Files
- Create `CLAUDE.md` files in strategic locations:
  * Root repository
  * Project subdirectories
  * Home folder (`~/.claude/CLAUDE.md`)
  
### What to Document in CLAUDE.md
- Bash commands (build, test, deploy)
- Code style guidelines
- Testing instructions
- Repository etiquette
- Developer environment setup
- Unexpected project behaviors
- Emphasis markers like "IMPORTANT", "CRITICAL", "NEVER"

### Quick Updates
- Use the `#` key to quickly update documentation

---

## 2. Context Management

### Optimizing Context
- Keep `CLAUDE.md` files concise (avoid bloat)
- Use `/clear` command to reset context when needed
- Leverage subagents for complex problems to avoid context overflow

### Thinking Modes
Progressive thinking depth:
- `think` - Basic reasoning
- `think hard` - Deeper analysis
- `think harder` - Complex problem solving
- `ultrathink` - Maximum reasoning depth

---

## 3. Subagent Workflows

### When to Use Multiple Claude Instances
- Code writing and verification (one writes, one reviews)
- Independent task execution
- Parallel problem-solving

### Recommended Techniques
- Create multiple git worktrees
- Use separate terminal tabs
- Maintain isolated working directories
- Share context between agents via docs/ files

---

## 4. Security Patterns

### Tool Permissions Management
- Use `/permissions` command to view/manage permissions
- Customize allowlists for specific tools
- Be cautious with `--dangerously-skip-permissions`

### Recommended Safety Practices
- Use containers without internet access for sensitive work
- Explicitly allow specific tools (whitelist approach)
- Review permission requests before approving

---

## 5. Documentation Practices

### Effective CLAUDE.md Annotations
- Use emphasis markers: "IMPORTANT", "CRITICAL", "NEVER", "ALWAYS"
- Provide detailed usage instructions with examples
- Include context-specific guidelines
- Document unexpected behaviors or gotchas

### Code Comments
- Explain "why" not "what" in comments
- Document security considerations
- Note any deviations from standard patterns

---

## 6. Code Quality Standards

### Test-Driven Development (TDD)
1. Write tests before implementation
2. Confirm tests fail initially
3. Implement code to pass tests
4. Verify tests don't overfit

### Iteration and Refinement
- Iterate on solutions multiple times
- Use visual mocks and screenshots for validation
- Request code reviews via subagents

---

## 7. Testing Approaches

### Testing Workflow
1. Write tests first (TDD)
2. Run tests to confirm failure
3. Implement minimal code to pass
4. Refactor while keeping tests green
5. Use subagents to validate coverage

### Validation
- Use visual mocks for UI components
- Take screenshots for comparison
- Test accessibility with screen readers
- Verify responsive design across devices

---

## 8. Recommended Workflows

### Explore-Plan-Code-Commit Pattern
1. **Explore**: Read relevant files, understand codebase
2. **Plan**: Create detailed implementation plan
3. **Code**: Implement solution incrementally
4. **Commit**: Create meaningful commits with context

### Multi-Instance Collaboration
- Instance A: Writes code
- Instance B: Reviews and tests
- Instance C: Handles documentation
- Share findings via markdown files

---

## 9. Memory and Context Sharing

### Using Memory Files
- Save project-specific knowledge to `.serena/memories/`
- Use `write_memory` for patterns, architecture decisions
- Share context between subagents via `docs/` folder

### Context Files for Subagents
- Create findings files: `docs/component-research.md`
- Pass findings to next agent in chain
- Avoid context overflow by chunking information

---

## 10. Tool Usage Patterns

### Prefer Specialized Tools
- Use `Read` instead of `cat/head/tail`
- Use `Edit` instead of `sed/awk`
- Use `Write` instead of `echo >` or heredocs
- Reserve `Bash` for actual system commands

### Batch Operations
- Make multiple independent tool calls in single message
- Parallelize when possible (multiple `Bash` calls)
- Chain dependent commands with `&&`

---

## 11. Security-First Development

### Authentication and Authorization
- Always validate user permissions
- Implement rate limiting
- Use secure token management
- Never expose sensitive data in logs

### Data Protection
- Implement tenant isolation (multi-tenancy)
- Use security rules at multiple layers
- Validate all inputs (client + server)
- Use prepared statements/parameterized queries

---

## 12. Progressive Enhancement

### Start Simple, Add Complexity
1. Build MVP with core functionality
2. Add validation layer
3. Add accessibility features
4. Add advanced UX improvements
5. Add performance optimizations

### Incremental Testing
- Test after each enhancement
- Don't batch all features before testing
- Verify no regressions after additions

---

## 13. Design Systems and Tokens

### Centralized Theming
- Use CSS variables/design tokens
- Single source of truth for colors, spacing, typography
- Enable rebranding via one-file updates
- Support light/dark modes

### Component Reusability
- Build shared component libraries
- Follow DRY (Don't Repeat Yourself)
- Use composition over duplication
- Create component APIs with TypeScript interfaces

---

## 14. Accessibility Standards

### WCAG AA Compliance
- Label all form inputs
- Use semantic HTML
- Implement ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Maintain 4.5:1 color contrast

### Best Practices
- `role="alert"` for errors
- `aria-describedby` for error linking
- `aria-invalid` on error fields
- `aria-busy` for loading states

---

## 15. Version Control Practices

### Commit Hygiene
- Use conventional commits format
- Write descriptive commit messages
- Include "why" context in messages
- Reference issue/ticket numbers

### Branch Management
- Use feature branches
- Create PR/MR for reviews
- Use git worktrees for parallel work
- Keep main/master clean

---

## 16. Performance Considerations

### Bundle Size
- Use tree-shakeable libraries
- Lazy load routes/components
- Monitor bundle size impact
- Use code splitting

### Runtime Performance
- Minimize re-renders (useCallback, useMemo)
- Use CSS for animations (not JS)
- Implement virtualization for long lists
- Optimize images and assets

---

## 17. Error Handling

### User-Friendly Errors
- Map technical errors to friendly messages
- Provide actionable guidance
- Log technical details for debugging
- Never expose stack traces to users

### Defensive Programming
- Validate all inputs
- Handle edge cases
- Provide fallbacks
- Fail gracefully

---

## 18. Documentation Hierarchy

### Levels of Documentation
1. **Inline comments** - Complex logic explanations
2. **JSDoc/TSDoc** - Function/component APIs
3. **README.md** - Project overview, setup
4. **CLAUDE.md** - AI-specific guidance, commands
5. **docs/** - Detailed guides, architecture decisions

---

## 19. Deployment Checklist

### Pre-Deployment
- Run all tests (unit, integration, e2e)
- Check TypeScript compilation
- Verify environment variables
- Test in production mode locally
- Review security rules/policies

### Deployment Order
1. Deploy database migrations/indexes
2. Deploy security rules
3. Deploy backend functions/APIs
4. Deploy frontend application
5. Smoke test critical paths

---

## 20. Continuous Improvement

### Reflection and Iteration
- Review completed work for improvements
- Update CLAUDE.md with lessons learned
- Document gotchas and solutions
- Share knowledge via memory files

### Feedback Loops
- Use subagents for code review
- Request multiple iterations
- Validate with users/stakeholders
- Monitor production errors

---

**Last Updated**: 2025-10-07  
**Source**: https://www.anthropic.com/engineering/claude-code-best-practices  
**Status**: ✅ Reference guide for all projects