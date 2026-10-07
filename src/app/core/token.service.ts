import { Injectable } from '@angular/core';

const CHAVE_TOKEN_ACESSO = 'lumi_entrega_token_acesso';
const CHAVE_TOKEN_REFRESH = 'lumi_entrega_token_refresh';

@Injectable({ providedIn: 'root' })
export class TokenService {
  get tokenAcesso(): string | null {
    return localStorage.getItem(CHAVE_TOKEN_ACESSO);
  }

  get tokenRefresh(): string | null {
    return localStorage.getItem(CHAVE_TOKEN_REFRESH);
  }

  salvarTokens(tokenAcesso: string, tokenRefresh?: string): void {
    localStorage.setItem(CHAVE_TOKEN_ACESSO, tokenAcesso);
    if (tokenRefresh) {
      localStorage.setItem(CHAVE_TOKEN_REFRESH, tokenRefresh);
    }
  }

  limpar(): void {
    localStorage.removeItem(CHAVE_TOKEN_ACESSO);
    localStorage.removeItem(CHAVE_TOKEN_REFRESH);
  }
}
