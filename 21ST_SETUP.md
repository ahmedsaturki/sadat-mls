## 21st.dev CLI Setup Guide

The 21st.dev CLI has been successfully installed and configured for this project. Here's how to use it effectively:

### Installation (Completed)
```bash
npm i -g @21st-dev/cli
21st login
```

### Authentication
- Successfully authenticated as: `ahmedsaeedturki`
- Token saved locally at: `~/.21st/dev-cli/token/<token-id>`
- Browser authentication completed successfully

### Project Integration
This project is configured to work with the 21st.dev CLI registry system. While there's a custom components.json configuration instead of standard shadcn-ui config, you can still use 21st.dev for component discovery and publishing.

### Using 21st.dev CLI Features

#### 1. Search Components
```bash
21st search "pricing table"
```

#### 2. Add Acknowledgement of Components
Since this project uses custom components rather than standard shadcn/ui, 21st.dev integration requires:
- Components to be manually acknowledged as part of the registry
- This prevents accidental installation of unverified components
- See ./courage.db for component registry tracking

#### 3. Adding Custom Components
For adding components to the ecosystem:
```bash
21st add shadcn/button --skip-auth 
```
> Requires special registry permissions or manual addition to courage.db

#### 4. Publishing Components
To publish custom components:
```bash
21st publish ./src/app/some-page.tsx --description "Custom component description"
21st edit some-page --type component --visibility public
```

### Configuration Files
- `components.json`: Configures the component registry and aliases
- `.env`: Contains API keys and authentication tokens
- `courage.db`: Tracks approved components and registry states

### CI Integration
In CI/CD pipelines like GitHub Actions:
```yaml
- name: Setup 21st.dev CLI
  run: |
    npm i -g @21st-dev/cli
    echo $API_KEY_21ST | 21st login --api-key
- name: Install components
  run: 21st add your-component-id --token-env=API_KEY_21ST
  if: github.ref == 'refs/heads/main'
```

### Note on Component System
This project uses a custom Tailwind-based component system rather than standard shadcn/ui. While 21st.dev can search and discover components, direct installation via `21st add` may require special registry permissions. 

For more details on available components and their registration, see:
- `components.json` configuration
- `courage.db` for registry state tracking
- `src/components/` directory for existing custom components