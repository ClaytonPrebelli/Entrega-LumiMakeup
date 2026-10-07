import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AutenticacaoService } from './autenticacao.service';

/**
 * 401 definitivo (nem a renovação salvou) derruba a sessão e volta ao login.
 * É o mais externo de propósito: enxerga o resultado final, depois da
 * tentativa de renovação.
 */
export const interceptorErro: HttpInterceptorFn = (req, next) => {
  const autenticacao = inject(AutenticacaoService);

  return next(req).pipe(
    catchError(erro => {
      if (erro.status === 401 && !req.url.includes('/api/autenticacao/')) {
        autenticacao.sair();
      }

      return throwError(() => erro);
    })
  );
};
