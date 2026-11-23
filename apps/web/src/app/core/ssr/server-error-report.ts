export type ServerErrorReport = {
  readonly message: string;
  readonly request?: { readonly method: string | undefined; readonly url: string | undefined };
};

// Fourni par le serveur Node : journal du conteneur, puis Sentry si un DSN est configuré.
export type ReportServerError = (error: unknown, report: ServerErrorReport) => void;
