const pkg = require('../package.json');

describe('Outils de qualité (scripts npm)', () => {
  it('expose lint, typecheck, test et validate pour un workflow reproductible', () => {
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.typecheck).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.validate).toMatch(/lint/);
    expect(pkg.scripts.validate).toMatch(/typecheck/);
    expect(pkg.scripts.validate).toMatch(/test/);
  });
});
