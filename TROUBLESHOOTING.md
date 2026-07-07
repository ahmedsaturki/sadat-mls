# Troubleshooting Guide for 21st.dev Integration

## Rate Limit Issues

### Problem: Component Code Rate Limit
```bash
Your reached the free 21st component-code limit (2/day), resets 2026-07-08T00:00:00.000Z.
Component code on 21st is paid; tell the user and share the upgrade link: https://21st.dev/pricing
```

**Solution:**

1. **Use `--dry-run` mode** for development and testing:
   ```bash
   node scripts/adapt-all.js --dry-run
   ```

2. **Test manifest parsing** without API calls:
   ```bash
   node scripts/adapt-all.js --dry-run --manifest scripts/component-manifest.json
   ```

3. **Upgrade to 21st.dev Pro**:
   https://21st.dev/pricing

4. **Use individual tools** instead of batch processing:
   ```bash
   node scripts/adapt-component.js 1323 CustomButton --api-key your-key
   ```

## Common Error Messages

### Error: "API_KEY_21ST is not set"
**Fix:** Copy `.env.example` to `.env`:
```bash
cp .env.example .env
echo "API_KEY_21ST=your-21st-dev-api-key" >> .env
```

### Error: Manifest File Not Found
**Fix:** Ensure `scripts/component-manifest.json` exists:
```bash
cat > scripts/component-manifest.json << EOF
{
  "components": [
    {
      "id": "1323",
      "name": "Button",
      "description": "Shadcn button baseline"
    }
  ]
}
EOF
```

### Error: Component Not Found
**Fix:** Check component IDs from 21st.dev search:
```bash
21st search "button"
# Look for component IDs like 1323, 64, 143, 3824
```

## File Structure Requirements

```
sadat-mls-cloud/
├── scripts/
│   ├── adapt-component.js          # Core adaptation logic
│   ├── adapt-all.js                 # Wrapper for batch processing
│   ├── component-manifest.json     # Component registry
│   ├── cli-config.sh               # Deployment configuration
│   └── analyze.js                  # Component analysis
├── src/components/                # Project-owned component system
│   ├── ui/                        # Custom Tailwind v4 components
│   └── ...
├── .env                          # Environment configuration
├── .env.example                  # Environment template
├── components.json               # Registry configuration
└── README.md                     # Project documentation
```

## Command Reference

### Initialization Commands

```bash
# Verify setup (shows what's about to happen)
node scripts/adapt-all.js --dry-run

# Full adaptation (requires active 21st.dev API key)
node scripts/adapt-all.js
```

### Manifest Management

```bash
# Create custom manifest (example with 3 components)
cat > scripts/custom-manifest.json << EOF
{
  "components": [
    { "id": "1323", "name": "Button", "description": "Shadcn button" },
    { "id": "64", "name": "ParticleButton", "description": "Particle effect button" },
    { "id": "143", "name": "OriginButton", "description": "Originui button" }
  ]
}
EOF

# Use custom manifest
node scripts/adapt-all.js --manifest scripts/custom-manifest.json
```

### Component Management

```bash
# Single component adaptation
node scripts/adapt-component.js 1323 CustomButton
node scripts/adapt-component.js 64 ParticleButton

# With API key (optional, can read from .env)
node scripts/adapt-component.js 1323 CustomButton --api-key your-key-here
```

## Production Considerations

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Adapt Components
  run: |
    cd ${{ github.workspace }}
    # Install and login with token
    npm i -g @21st-dev/cli
    21st login --api-key ${{ secrets.API_KEY_21ST }}
    # Adapt components
    node scripts/adapt-all.js

# GitHub Actions for development (dry-run)
- name: Test Manifest
  run: |
    cd ${{ github.workspace }}
    node scripts/adapt-all.js --dry-run
```

### Environment Management

```bash
# Production environment (never commit secrets)
API_KEY_21ST=prod-21st-dev-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Development environment
API_KEY_21ST=dev-21st-dev-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Common Scenarios

### Local Development
```bash
# Set up development
cp .env.example .env
echo "API_KEY_21ST=dev-key-here" >> .env

# Test what's going to happen
node scripts/adapt-all.js --dry-run

# Actually run when ready
node scripts/adapt-all.js
```

### Production Deployment
```bash
# Ensure clean state before deployment
# Check manifest first
node scripts/adapt-all.js --dry-run

# Execute in production environment
node scripts/adapt-all.js
```

## Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development, staging, and production
3. **Backup existing components** before adaptation
4. **Test with `--dry-run` first** to see what will be generated
5. **Monitor for rate limits** if using frequent API calls
6. **Use version control** for component manifests
7. **Document sources** and transformations

## Error Resolution

### Component Adaptations Failed
1. Check API key validity
2. Verify component IDs exist in 21st.dev
3. Test connection to 21st.dev
4. Try dry-run mode to verify configuration

### Slow Adaptation or Timeouts
1. Extend timeout (currently 120 seconds)
2. Try fewer components at once (single adaptation)
3. Check network connectivity
4. Consider upgrading for higher limits

### Manifest Parsing Issues
1. Validate JSON syntax
2. Check required field names (`id`, `name`, `description`)
3. Ensure component array exists
4. Validate component ID format (should be numbers)

### Components Overwrite Existing Files
1. Update component names to avoid conflicts
2. Verify target paths
3. Check file permissions
4. Update components.json registry accordingly

## Final Checklist

### Before Running
- [ ] `.env` file created with API key
- [ ] Manifest file exists in `scripts/component-manifest.json`
- [ ] Component IDs are valid and accessible
- [ ] Free 21st.dev rate limit has reset (or paid account)

### During Execution
- [ ] Dry-run mode confirmed expected behavior
- [ ] Components will be placed in correct directory (`src/components/ui/`)
- [ ] Project configurations will be updated (`components.json`)
- [ ] Error handling covers network issues and API rate limits

### After Execution
- [ ] Review adapted component code for project standards compliance
- [ ] Update component documentation if needed
- [ ] Test adapted components in development environment
- [ ] Plan for future component updates

This configuration provides a complete, sustainable approach to integrating external UI components while maintaining full control and flexibility for your project's development process.