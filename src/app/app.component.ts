import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacaoService } from './core/autenticacao.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (autenticacao.usuario()) {
      <header class="topo">
        <span class="marca">LUMI ENTREGAS</span>
        <nav>
          <a routerLink="/pedidos" routerLinkActive="ativa">Pedidos</a>
          <a routerLink="/relatorios" routerLinkActive="ativa">Relatórios</a>
        </nav>
        <button type="button" class="sair" (click)="autenticacao.sair()" aria-label="Sair">
          Sair
        </button>
      </header>
    }

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    .topo {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.7rem 1rem;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .marca {
      font-weight: 700;
      letter-spacing: 2px;
      font-size: 0.85rem;
      color: var(--color-primary-dark);
    }

    nav {
      display: flex;
      gap: 0.2rem;
      flex: 1;
    }

    nav a {
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-pill);
      text-decoration: none;
      color: var(--color-text);
      font-size: 0.95rem;
    }

    nav a.ativa {
      background: var(--color-background);
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    .sair {
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--color-primary-dark);
      padding: 0.45rem 1rem;
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
    }
  `
})
export class AppComponent {
  readonly autenticacao = inject(AutenticacaoService);
}
