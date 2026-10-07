import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container tela">
      <div class="card caixa">
        <p class="marca">LUMI MAKEUP</p>
        <h1>Entregas</h1>

        @if (erro()) {
          <p class="alerta-erro">{{ erro() }}</p>
        }

        <label>
          <span>Usuário ou e-mail</span>
          <input
            class="input"
            name="identificador"
            [(ngModel)]="identificador"
            placeholder="Seu usuário"
            autocomplete="username"
            (keyup.enter)="entrar()"
          />
        </label>

        <label>
          <span>Senha</span>
          <input
            class="input"
            type="password"
            name="senha"
            [(ngModel)]="senha"
            placeholder="••••••••"
            autocomplete="current-password"
            (keyup.enter)="entrar()"
          />
        </label>

        <button type="button" class="btn btn-bloco" (click)="entrar()" [disabled]="entrando()">
          {{ entrando() ? 'Entrando…' : 'Entrar' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .tela {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .caixa {
      width: 100%;
      max-width: 380px;
      padding: 1.8rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .marca {
      text-align: center;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--color-primary-dark);
    }

    .caixa h1 {
      text-align: center;
      font-size: 1.4rem;
      margin-bottom: 0.4rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.9rem;
    }
  `
})
export class LoginComponent {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);

  readonly erro = signal<string | null>(null);
  readonly entrando = signal(false);

  identificador = '';
  senha = '';

  async entrar(): Promise<void> {
    if (!this.identificador.trim() || !this.senha) {
      this.erro.set('Informe usuário e senha.');
      return;
    }

    this.erro.set(null);
    this.entrando.set(true);

    try {
      await this.autenticacao.entrar(this.identificador.trim(), this.senha);
      void this.router.navigate(['/pedidos']);
    } catch (erro) {
      // Papel errado (cliente comum) tem mensagem própria; o resto é
      // credencial inválida ou API fora do ar.
      this.erro.set(
        erro instanceof Error && erro.message === 'Este portal é só para entregadores.'
          ? erro.message
          : 'Usuário ou senha inválidos.'
      );
    } finally {
      this.entrando.set(false);
    }
  }
}
