# Branch Protection Rules

This document outlines the recommended branch protection rules for the AgentDashboard repository. These rules must be configured manually through the GitHub repository settings.

## Why Branch Protection?

Branch protection rules ensure:
- Code quality through required reviews
- CI/CD validation before merging
- Prevention of accidental force pushes
- Maintain linear history
- Security through required status checks

## Setup Instructions

### Step 1: Access Branch Protection Settings

1. Go to repository: https://github.com/mukul975/agentdashboard
2. Navigate to **Settings** → **Branches**
3. Click **Add branch protection rule**

---

## Main Branch Protection (`main`)

The `main` branch contains production-ready code. Apply the strictest protection rules.

### Rule Configuration

**Branch name pattern**: `main`

#### ✅ Required Settings

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1** (increase to 2 for stricter control)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS file exists)
  - [x] Require approval of the most recent reviewable push

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (20.x)` - Tests on Node 20.x
    - `test (22.x)` - Tests on Node 22.x
    - `lint` - Linting and security checks
    - `CodeQL` - Security analysis
    - `codecov/patch` - Code coverage for new code
    - `codecov/project` - Overall code coverage

- [x] **Require conversation resolution before merging**
  - All review comments must be resolved

- [x] **Require signed commits** (Recommended for enhanced security)
  - Ensures commit authenticity

- [x] **Require linear history**
  - Prevents merge commits, requires rebase or squash
  - Keeps git history clean and readable

- [x] **Do not allow bypassing the above settings**
  - Applies to administrators as well

#### ❌ Optional Settings (Consider carefully)

- [ ] **Include administrators**
  - When enabled, rules apply to repo admins too
  - **Recommendation**: Enable for maximum security

- [ ] **Restrict who can push to matching branches**
  - Limit to specific users/teams
  - **Recommendation**: Only allow merges via pull requests

- [ ] **Allow force pushes** → **Never allow** (Disabled)
  - **Recommendation**: Keep disabled to prevent history rewriting

- [ ] **Allow deletions** → **Never allow** (Disabled)
  - **Recommendation**: Keep disabled to prevent accidental deletion

### Screenshot Reference

```
┌─────────────────────────────────────────────────────────────┐
│ Branch protection rule for: main                             │
├─────────────────────────────────────────────────────────────┤
│ ✓ Require a pull request before merging                     │
│   ├─ Required approvals: 1                                   │
│   ├─ Dismiss stale reviews: Yes                              │
│   └─ Require approval of most recent push: Yes               │
│                                                               │
│ ✓ Require status checks to pass                             │
│   ├─ Require up to date: Yes                                 │
│   └─ Required checks:                                        │
│       • test (20.x)                                           │
│       • test (22.x)                                           │
│       • lint                                                  │
│       • CodeQL                                                │
│       • codecov/patch                                         │
│       • codecov/project                                       │
│                                                               │
│ ✓ Require conversation resolution                           │
│ ✓ Require signed commits                                    │
│ ✓ Require linear history                                    │
│ ✓ Do not allow bypassing                                    │
│                                                               │
│ ✗ Allow force pushes: Never allow                           │
│ ✗ Allow deletions: Never allow                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Develop Branch Protection (`develop`)

The `develop` branch contains integration-ready code. Apply moderate protection rules.

### Rule Configuration

**Branch name pattern**: `develop`

#### ✅ Required Settings

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require review from Code Owners (optional)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (22.x)` - Tests on latest Node version
    - `lint` - Linting and security checks
    - `CodeQL` - Security analysis

- [x] **Require conversation resolution before merging**

- [x] **Require linear history**

- [ ] **Do not allow bypassing the above settings**
  - May allow maintainers to bypass for urgent fixes

#### ⚠️ More Flexible Settings

- [ ] **Allow force pushes**
  - **Recommendation**: Allow only for specified roles (maintainers)
  - Useful for cleaning up history before merging to main

- [ ] **Allow deletions** → **Never allow** (Disabled)

---

## Feature Branch Protection Pattern (`feature/*`)

Optional protection for feature branches if team workflow requires it.

### Rule Configuration

**Branch name pattern**: `feature/*`

#### ✅ Minimal Protection

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**

- [x] **Require status checks to pass before merging**
  - **Required status checks:**
    - `test (22.x)`
    - `lint`

---

## Release Branch Protection (`release/*`)

Protection for release preparation branches.

### Rule Configuration

**Branch name pattern**: `release/*`

#### ✅ Required Settings

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Require review from Code Owners

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (20.x)`
    - `test (22.x)`
    - `lint`
    - `CodeQL`

- [x] **Require signed commits**

- [x] **Require linear history**

- [x] **Do not allow bypassing**

---

## Verification Steps

After configuring branch protection rules:

### 1. Test Pull Request Flow

```bash
# Create a test branch
git checkout -b test/branch-protection

# Make a change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: verify branch protection"

# Push branch
git push origin test/branch-protection

# Create PR via GitHub UI
# Verify that:
# - Direct push to main/develop is blocked
# - PR requires approval
# - Status checks must pass
# - Merge is blocked until all checks pass
```

### 2. Test Status Check Requirements

```bash
# Push code that fails tests
# Verify that:
# - PR shows failing status checks
# - Merge button is disabled
# - Fix code and push again
# - Merge button enables after checks pass
```

### 3. Test Force Push Protection

```bash
# Try to force push to protected branch
git push --force origin main
# Should fail with: "protected branch hook declined"
```

### 4. Test Signed Commit Requirement

```bash
# Try to push unsigned commit
# Should fail if signed commits are required

# Configure GPG signing
git config commit.gpgsign true
git commit --amend --no-edit -S
git push origin feature-branch
```

---

## Monitoring & Maintenance

### Regular Reviews

- **Monthly**: Review protection rules effectiveness
- **Quarterly**: Adjust based on team workflow
- **After incidents**: Strengthen rules if needed

### Metrics to Track

- Number of PRs blocked by protection rules
- Time to merge PRs (ensure rules don't slow down too much)
- Number of failed status checks
- Code coverage trends

### Audit Log

GitHub provides audit logs for branch protection changes:
1. Go to **Settings** → **Audit log**
2. Filter by `protected_branch` events
3. Review changes to protection rules

---

## Troubleshooting

### Issue: Can't merge even though all checks pass

**Solution:**
- Ensure branch is up to date with base branch
- Rebase or merge base branch into your branch
- Check if all conversations are resolved

### Issue: Status check not appearing

**Solution:**
- Ensure the check name matches exactly (case-sensitive)
- Verify the workflow is triggered for PR branches
- Check GitHub Actions logs for failures

### Issue: Required check never completes

**Solution:**
- Check if workflow is configured correctly
- Ensure workflow runs on `pull_request` events
- Verify no required checks are from old/removed workflows

---

## CODEOWNERS Setup (Optional)

Create `.github/CODEOWNERS` file to automatically request reviews:

```
# Default owner for everything
* @mukul975

# Frontend code
/src/**/*.jsx @mukul975
/src/**/*.css @mukul975

# Backend code
/server.js @mukul975
/config.js @mukul975

# CI/CD workflows
/.github/workflows/ @mukul975

# Security files
/SECURITY.md @mukul975
/.github/workflows/codeql.yml @mukul975

# Documentation
/docs/ @mukul975
*.md @mukul975
```

---

## Security Considerations

### Best Practices

1. **Never disable protection rules** without team discussion
2. **Require signed commits** for audit trails
3. **Enforce status checks** to maintain code quality
4. **Regular security audits** via CodeQL and Dependabot
5. **Monitor branch protection events** in audit log

### Emergency Bypass Procedure

If urgent fixes are needed and protection rules block deployment:

1. **Document the emergency** in an issue
2. **Get approval** from repository owner
3. **Temporarily bypass** with justified reason
4. **Re-enable protection** immediately after
5. **Post-mortem** to prevent future need for bypass

---

## Additional Resources

- [GitHub Branch Protection Rules Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Signed Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)

---

**Last Updated**: 2026-02-10
**Maintained By**: @mukul975
**Review Schedule**: Quarterly
