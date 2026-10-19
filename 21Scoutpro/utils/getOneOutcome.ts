export interface GetOneBody<T> {
  success?: boolean;
  data?: T | null;
  error?: string;
}

export type GetOneDecision<T> =
  | { kind: 'data'; data: T }
  | { kind: 'not_found' }
  | { kind: 'failure'; reason: string };

/**
 * 404 é ausência do recurso (null). Qualquer outra falha HTTP, corpo inválido
 * ou payload sem dados é erro — não pode virar null.
 */
export function classifyGetOneHttp<T>(input: {
  status: number;
  parseFailed: boolean;
  body: GetOneBody<T> | null;
}): GetOneDecision<T> {
  if (input.status === 404) return { kind: 'not_found' };
  if (input.status < 200 || input.status >= 300) {
    return { kind: 'failure', reason: `Falha ao carregar o recurso (HTTP ${input.status}).` };
  }
  if (input.parseFailed || !input.body) {
    return { kind: 'failure', reason: 'Falha ao carregar o recurso: resposta inválida.' };
  }
  if (input.body.success !== true || input.body.data == null) {
    return { kind: 'failure', reason: 'Falha ao carregar o recurso: resposta sem dados.' };
  }
  return { kind: 'data', data: input.body.data };
}

export class GetOneFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetOneFailure';
  }
}
