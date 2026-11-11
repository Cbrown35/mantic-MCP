export interface CompiledMjml {
  html: string;
  warnings: string[];
}

type Mjml2Html = typeof import('mjml').default;
let mjmlLoader: Promise<Mjml2Html> | undefined;

/**
 * Load mjml on first use, not at server start.
 *
 * When mjml-core is first loaded it reads `.mjmlconfig` from the working
 * directory and require()s the component packages listed there. An MCP client
 * may start this server inside any project folder, so that would run whatever
 * code such a file points at. With MJML_BROWSER set during the load, mjml-core
 * skips those requires (it is the switch mjml uses for its browser build).
 */
function loadMjml(): Promise<Mjml2Html> {
  if (!mjmlLoader) {
    const previous = process.env.MJML_BROWSER;
    process.env.MJML_BROWSER = 'true';
    mjmlLoader = import('mjml')
      .then(mod => mod.default)
      .finally(() => {
        if (previous === undefined) delete process.env.MJML_BROWSER;
        else process.env.MJML_BROWSER = previous;
      });
  }
  return mjmlLoader;
}

/**
 * Compile MJML to the HTML Mautic sends.
 *
 * Validation is "soft": the GrapesJS builder itself writes MJML that strict
 * validation rejects (it adds `id` attributes, for example), so problems are
 * returned as warnings instead of failing the call. MJML the parser cannot read
 * throws. `<mj-include>` is never resolved, so MJML from a client cannot pull
 * files from this machine.
 */
export async function compileMjml(mjml: string): Promise<CompiledMjml> {
  const mjml2html = await loadMjml();
  const result = await mjml2html(mjml, { validationLevel: 'soft', ignoreIncludes: true });
  return {
    html: result.html,
    // Built here rather than taken from `formattedMessage`, which names this
    // server's working directory.
    warnings: result.errors.map(e => `Line ${e.line} (${e.tagName}): ${e.message}`),
  };
}
