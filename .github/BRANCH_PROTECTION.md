# Branch Protection Rules

**Ruleset ID**: `12620515`
**Status**: ✅ Active
**Created**: February 10, 2026

---

## 📋 Main Branch Protection

### Protected Branches
- `main` branch

### Enabled Rules

#### 🔒 **Pull Request Requirements**
- ✅ **1 approving review required** before merging
- ✅ **Dismiss stale reviews** when new commits are pushed
- ✅ **Require conversation resolution** before merging
- ✅ Allow merge methods: merge, squash, rebase

#### ✅ **Required Status Checks**
- ✅ **build** must pass
- ✅ **test** must pass
- ✅ **Strict mode enabled** (branch must be up to date with base)

#### 🚫 **Restrictions**
- ❌ **No force pushes** (non-fast-forward)
- ❌ **No branch deletion**
- ✅ **Linear history required** (no merge commits)

#### 👥 **Bypass Permissions**
- Repository administrators can bypass all rules

---

## 🎯 What This Means

### For Contributors
1. **Create a pull request** - Direct pushes to `main` are blocked
2. **Wait for CI checks** - Build and tests must pass
3. **Get 1 approval** - Another maintainer must review your code
4. **Resolve discussions** - All review comments must be resolved
5. **Keep branch updated** - Rebase or merge latest `main` before merging

### For Maintainers
1. **Review PRs carefully** - You're the gatekeeper for code quality
2. **Check CI status** - Don't approve if tests are failing
3. **Resolve conversations** - Ensure all feedback is addressed
4. **Use squash/rebase** - Keep commit history clean

---

## 📊 Workflow Example

\`\`\`bash
# 1. Create feature branch
git checkout -b feature/amazing-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# 3. Push to your fork/branch
git push origin feature/amazing-feature

# 4. Create pull request on GitHub
# - CI checks run automatically
# - Request review from maintainers

# 5. Address feedback
git add .
git commit -m "fix: address review feedback"
git push origin feature/amazing-feature

# 6. Maintainer approves and merges
# - All checks must pass
# - 1 approval required
# - All conversations resolved
\`\`\`

---

## 🔧 Modifying the Ruleset

### Via GitHub CLI

Update the ruleset:
\`\`\`bash
gh api repos/mukul975/claude-team-dashboard/rulesets/12620515 --method PUT --input ruleset.json
\`\`\`

View current ruleset:
\`\`\`bash
gh api repos/mukul975/claude-team-dashboard/rulesets/12620515
\`\`\`

Delete ruleset:
\`\`\`bash
gh api repos/mukul975/claude-team-dashboard/rulesets/12620515 --method DELETE
\`\`\`

### Via GitHub UI

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click on **"Main Branch Protection"**
3. Modify rules as needed
4. Click **Save changes**

---

## 📚 Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Branch Protection Best Practices](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

**Last Updated**: February 10, 2026
**Ruleset URL**: https://github.com/mukul975/claude-team-dashboard/rules/12620515
