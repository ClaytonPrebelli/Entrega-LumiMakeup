import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacaoService } from './autenticacao.service';

/** Só entra quem pode entregar: entregador ou admin. */
export const entregaGuard: CanActivateFn = () => {
  const autenticacao = inject(AutenticacaoService);
  const router = inject(Router);

  if (autenticacao.podeEntregar) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
