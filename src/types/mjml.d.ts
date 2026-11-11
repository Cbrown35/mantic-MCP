// Minimal typings for the parts of mjml 5 used here (the package ships no types).
declare module 'mjml' {
  interface MjmlError {
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  }

  interface MjmlResult {
    html: string;
    errors: MjmlError[];
  }

  interface MjmlOptions {
    validationLevel?: 'strict' | 'soft' | 'skip';
    ignoreIncludes?: boolean;
    keepComments?: boolean;
    minify?: boolean;
  }

  export default function mjml2html(input: string, options?: MjmlOptions): Promise<MjmlResult>;
}
