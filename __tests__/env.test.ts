import { getAppEnv } from '../src/config/env';

describe('getAppEnv', () => {
  const previous = process.env.EXPO_PUBLIC_APP_ENV;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_APP_ENV;
    } else {
      process.env.EXPO_PUBLIC_APP_ENV = previous;
    }
  });

  it('retourne development lorsque la variable est absente ou non reconnue', () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    expect(getAppEnv()).toBe('development');
    process.env.EXPO_PUBLIC_APP_ENV = 'staging';
    expect(getAppEnv()).toBe('development');
  });

  it('retourne preview ou production lorsque la variable est définie ainsi', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'preview';
    expect(getAppEnv()).toBe('preview');
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    expect(getAppEnv()).toBe('production');
  });
});
