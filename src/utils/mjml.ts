import mjml2html from 'mjml';

export interface CompiledMjml {
  html: string;
  warnings: string[];
}

/**
 * Compile MJML to the HTML Mautic sends.
 *
 * Validation is "soft": the GrapesJS builder itself writes MJML that strict
 * validation rejects (it adds `id` attributes, for example), so problems are
 * returned as warnings instead of failing the call. `<mj-include>` is never
 * resolved, so MJML from a client cannot pull files from this machine.
 */
export async function compileMjml(mjml: string): Promise<CompiledMjml> {
  const result = await mjml2html(mjml, { validationLevel: 'soft', ignoreIncludes: true });
  if (!result.html || !result.html.trim()) {
    const reasons = result.errors.map(e => e.formattedMessage || e.message).join('; ');
    throw new Error(`MJML produced no HTML${reasons ? `: ${reasons}` : ''}`);
  }
  return {
    html: result.html,
    warnings: result.errors.map(e => e.formattedMessage || e.message),
  };
}
