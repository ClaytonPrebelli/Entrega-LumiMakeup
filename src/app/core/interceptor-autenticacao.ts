import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';
import { RenovacaoDeTokenService } from './renovacao-de-token.service';

const ROTA_RENOVAR = '/api/autenticacao/renovar';

/**
 * Anexa o Bearer nas chamadas da API e tenta renovar uma vez no 401, antes de
 * desistir. A renovação não passa por aqui.
 */
export const interceptorAutenticacao: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const renovacao = inject(RenovacaoDeTokenService);

  const token = tokens.tokenAcesso;

  if (!token || !req.url.startsWith(environment.urlDaApi) || req.url.includes(ROTA_RENOVAR)) {
    return next(req);
  }

  const autenticada = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(autenticada).pipe(
    catchError(erro => {
      if (erro.status !== 401) {
        return throwError(() => erro);
      }

      return from(renovacao.renovar()).pipe(
        switchMap(novoToken => {
          if (!novoToken) {
            return throwError(() => erro);
          }

          return next(autenticada.clone({ setHeaders: { Authorization: `Bearer ${novoToken}` } }));
        })
      );
    })
  );
};
