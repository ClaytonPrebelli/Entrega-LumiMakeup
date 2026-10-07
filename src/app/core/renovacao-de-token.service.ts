import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';

export interface RespostaDeRenovacao {
  tokenAcesso: string;
  tokenRefresh: string;
}

/**
 * Renova o token de acesso a partir do refresh token, sem interceptores para
 * não entrar em laço num 401 da própria renovação.
 */
@Injectable({ providedIn: 'root' })
export class RenovacaoDeTokenService {
  private readonly http: HttpClient;
  private readonly tokenService = inject(TokenService);
  private emAndamento: Promise<string | null> | null = null;

  constructor() {
    this.http = new HttpClient(inject(HttpBackend));
  }

  renovar(): Promise<string | null> {
    if (this.emAndamento) {
      return this.emAndamento;
    }

    const refresh = this.tokenService.tokenRefresh;

    if (!refresh) {
      return Promise.resolve(null);
    }

    this.emAndamento = firstValueFrom(
      this.http.post<RespostaDeRenovacao>(`${environment.urlDaApi}/api/autenticacao/renovar`, {
        tokenRefresh: refresh
      })
    )
      .then(resposta => {
        this.tokenService.salvarTokens(resposta.tokenAcesso, resposta.tokenRefresh);
        return resposta.tokenAcesso as string | null;
      })
      .catch(() => {
        this.tokenService.limpar();
        return null;
      })
      .finally(() => {
        this.emAndamento = null;
      });

    return this.emAndamento;
  }
}
