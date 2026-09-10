# Contributing to Credit Risk System

Thank you for your interest in contributing to the Credit Risk System! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Prioritize the project's best interests

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Push to your fork and submit a pull request

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix bugs reported in issues
- **Features**: Implement new features or enhance existing ones
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize code for better performance
- **Security**: Identify and fix security vulnerabilities

### First Time Contributors

Look for issues labeled with `good first issue` or `help wanted`. These are great starting points for new contributors.

## Development Setup

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
yarn install
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
yarn test
```

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for all functions and classes
- Keep functions small and focused
- Use meaningful variable names

Example:
```python
from typing import Dict, List

def calculate_risk_score(features: Dict[str, float]) -> float:
    """
    Calculate credit risk score based on input features.
    
    Args:
        features: Dictionary of feature names and values
        
    Returns:
        Risk score between 0 and 1
    """
    # Implementation here
    pass
```

### TypeScript/React (Frontend)

- Use TypeScript for type safety
- Follow React best practices and hooks guidelines
- Use functional components with hooks
- Keep components small and reusable
- Use meaningful component and variable names

Example:
```typescript
interface CreditFormProps {
  onSubmit: (data: CreditData) => void;
  loading?: boolean;
}

const CreditForm: React.FC<CreditFormProps> = ({ onSubmit, loading = false }) => {
  // Component implementation
};
```

### Commit Messages

Follow the conventional commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add real-time risk score visualization
fix: resolve API timeout on large datasets
docs: update API documentation for v2 endpoints
```

## Testing

### Writing Tests

- Write unit tests for all new functions
- Include integration tests for API endpoints
- Add E2E tests for critical user flows
- Maintain test coverage above 80%

### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific test file
pytest backend/tests/test_api.py -v
```

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Link any related issues

### PR Requirements

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] PR description explains changes

### Review Process

1. Automated tests will run on your PR
2. A maintainer will review your code
3. Address any feedback or requested changes
4. Once approved, your PR will be merged

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: How to reproduce the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Python/Node version
- **Screenshots**: If applicable
- **Logs**: Error messages or stack traces

### Feature Requests

For feature requests, please include:

- **Problem**: What problem does this solve?
- **Solution**: Your proposed solution
- **Alternatives**: Any alternatives considered
- **Additional Context**: Any other relevant information

## Development Guidelines

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### API Documentation

- Update OpenAPI specifications when adding endpoints
- Include request/response examples
- Document error codes and messages

### Security Considerations

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Report security issues privately to maintainers

## Getting Help

- Check existing issues and documentation
- Join our discussion forum
- Contact maintainers at admin@shaily.dev
- Ask questions in pull requests or issues

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Project website

Thank you for contributing to Credit Risk System!