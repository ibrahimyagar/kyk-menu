export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(ts|js|json|mjs|cjs)$/.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
