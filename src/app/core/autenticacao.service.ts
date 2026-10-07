import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

export type PapelUsuario = 'Cliente' | 'Administrador' | 'Entregador';

export interface Usuario {
  id: number;
  nome: string;
  email: string | null;
  papel: PapelUsuario;
}

interface RespostaDeAutenticacao {
  tokenAcesso: string;
  tokenRefresh: string;
  usuario: Usuario;
}

const CHAVE_USUARIO = 'lumi_entrega_usuario';

@Injectable({ providedIn: 'root' })
export class AutenticacaoService extends ApiService {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  readonly usuario = signal<Usuario | null>(this.carregarUsuarioDoArmazenamento());

  get estaAutenticado(): boolean {
    return this.usuario() !== null;
  }

  /** Só entregador e admin entram no portal. */
  get podeEntregar(): boolean {
    const papel = this.usuario()?.papel;
    return papel === 'Entregador' || papel === 'Administrador';
  }

  async entrar(identificador: string, senha: string): Promise<void> {
    const resposta = await firstValueFrom(
      this.http.post<RespostaDeAutenticacao>(`${this.urlBase}/api/autenticacao/entrar`, {
        email: identificador,
        senha
      })
    );

    if (resposta.usuario.papel !== 'Entregador' && resposta.usuario.papel !== 'Administrador') {
      throw new Error('Este portal é só para entregadores.');
    }

    this.tokenService.salvarTokens(resposta.tokenAcesso, resposta.tokenRefresh);
    this.definirUsuario(resposta.usuario);
  }

  sair(): void {
    this.tokenService.limpar();
    localStorage.removeItem(CHAVE_USUARIO);
    this.usuario.set(null);
    void this.router.navigate(['/login']);
  }

  private definirUsuario(usuario: Usuario): void {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  private carregarUsuarioDoArmazenamento(): Usuario | null {
    const bruto = localStorage.getItem(CHAVE_USUARIO);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  }
}
