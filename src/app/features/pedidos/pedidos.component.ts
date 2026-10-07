import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntregasService, PedidoDto } from '../../core/entregas.service';

type Aba = 'para-entregar' | 'entregues';
type Ordem = 'distancia' | 'distancia-desc' | 'recentes';

function enderecoCompleto(pedido: PedidoDto): string {
  const numero = pedido.enderecoNumero ? `, ${pedido.enderecoNumero}` : '';
  const complemento = pedido.enderecoComplemento ? ` - ${pedido.enderecoComplemento}` : '';
  const bairro = pedido.enderecoBairro ? ` - ${pedido.enderecoBairro}` : '';
  const cidade = pedido.enderecoCidade ? ` - ${pedido.enderecoCidade}/${pedido.enderecoEstado ?? ''}` : '';
  return `${pedido.enderecoLogradouro ?? ''}${numero}${complemento}${bairro}${cidade}`;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="container">
      <nav class="abas">
        <button
          type="button"
          [class.ativa]="aba() === 'para-entregar'"
          (click)="trocarAba('para-entregar')"
        >
          Para entregar ({{ paraEntregar().length }})
        </button>
        <button type="button" [class.ativa]="aba() === 'entregues'" (click)="trocarAba('entregues')">
          Entregues
        </button>
      </nav>

      @if (erro()) {
        <p class="alerta-erro">{{ erro() }}</p>
      }

      @if (aba() === 'para-entregar') {
        <label class="ordem">
          <span>Ordenar por</span>
          <select class="input" name="ordem" [(ngModel)]="ordem">
            <option value="distancia">Menor distância</option>
            <option value="distancia-desc">Maior distância</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </label>
      }

      @if (carregando()) {
        <div aria-busy="true" aria-label="Carregando pedidos">
          @for (_ of [1, 2, 3]; track $index) {
            <div class="card esqueleto">
              <div class="skeleton skeleton-linha" style="width: 40%"></div>
              <div class="skeleton skeleton-linha" style="width: 80%"></div>
              <div class="skeleton skeleton-linha" style="width: 60%"></div>
            </div>
          }
        </div>
      } @else if (visiveis().length === 0) {
        <p class="text-muted vazio">
          @if (aba() === 'para-entregar') {
            Nenhum pedido aguardando entrega.
          } @else {
            Nenhuma entrega sua ainda.
          }
        </p>
      } @else {
        <div class="lista">
          @for (pedido of visiveis(); track pedido.id) {
            <article class="card pedido">
              <header>
                <strong>#{{ pedido.id }} · {{ pedido.nomeCliente }}</strong>
                <span class="etiqueta" [class.ativo]="aba() === 'entregues'" [class.aguardando]="aba() !== 'entregues'">
                  {{ aba() === 'entregues' ? 'Entregue' : 'Despachado' }}
                </span>
              </header>

              <p class="endereco">{{ enderecoCompleto(pedido) }}</p>

              <dl class="dados">
                @if (pedido.enderecoBairro) {
                  <div><dt>Bairro</dt><dd>{{ pedido.enderecoBairro }}</dd></div>
                }
                <div><dt>Distância</dt><dd>{{ pedido.distanciaKm }} km</dd></div>
                <div><dt>Total</dt><dd>{{ pedido.total | currency: 'BRL' }}</dd></div>
                @if (aba() === 'entregues') {
                  <div>
                    <dt>Entregue em</dt>
                    <dd>{{ pedido.entregueEm ? (pedido.entregueEm | date: 'dd/MM HH:mm') : '—' }}</dd>
                  </div>
                } @else {
                  <div>
                    <dt>Despachado em</dt>
                    <dd>{{ pedido.despachadoEm ? (pedido.despachadoEm | date: 'dd/MM HH:mm') : '—' }}</dd>
                  </div>
                }
              </dl>

              @if (aba() === 'para-entregar') {
                <div class="botoes">
                  <a
                    class="btn"
                    [href]="rotaDoMaps(pedido)"
                    target="_blank"
                    rel="noopener"
                    (click)="iniciarRota(pedido)"
                  >
                    {{ navegando() === pedido.id ? 'Abrindo mapa…' : 'Iniciar rota' }}
                  </a>
                  <button
                    type="button"
                    class="btn btn-outline"
                    (click)="marcarEntregue(pedido)"
                    [disabled]="entregando() === pedido.id"
                  >
                    {{ entregando() === pedido.id ? 'Marcando…' : 'Marcar entregue' }}
                  </button>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .abas {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .abas button {
      flex: 1;
      min-height: var(--touch);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      font: inherit;
      cursor: pointer;
    }

    .abas button.ativa {
      border-color: var(--color-primary);
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    .ordem {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .ordem .input {
      width: auto;
      flex: 1;
    }

    .vazio {
      text-align: center;
      padding: 3rem 1rem;
    }

    .lista {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pedido {
      padding: 1.1rem 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .pedido header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .endereco {
      font-size: 0.95rem;
    }

    .dados {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.9rem;
    }

    .dados > div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .dados dt {
      color: var(--color-text-muted);
    }

    .dados dd {
      margin: 0;
      text-align: right;
    }

    .botoes {
      display: flex;
      gap: 0.6rem;
      margin-top: 0.3rem;
    }

    .botoes .btn {
      flex: 1;
      text-decoration: none;
    }

    .esqueleto {
      padding: 1.1rem 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1rem;
      pointer-events: none;
    }

    .skeleton-linha {
      height: 1rem;
    }
  `
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(EntregasService);

  readonly aba = signal<Aba>('para-entregar');
  readonly ordem = signal<Ordem>('distancia');
  readonly pedidos = signal<PedidoDto[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly entregando = signal<number | null>(null);
  readonly navegando = signal<number | null>(null);

  readonly paraEntregar = computed(() =>
    this.pedidos().filter(p => p.statusEntrega === 'Despachado')
  );

  readonly visiveis = computed(() => {
    const base =
      this.aba() === 'para-entregar'
        ? this.paraEntregar()
        : this.pedidos().filter(p => p.statusEntrega === 'Entregue');

    const lista = [...base];

    switch (this.ordem()) {
      case 'distancia':
        return lista.sort((a, b) => a.distanciaKm - b.distanciaKm);
      case 'distancia-desc':
        return lista.sort((a, b) => b.distanciaKm - a.distanciaKm);
      default:
        return lista.sort((a, b) => (b.despachadoEm ?? '').localeCompare(a.despachadoEm ?? ''));
    }
  });

  ngOnInit(): void {
    this.carregar();
  }

  trocarAba(aba: Aba): void {
    this.aba.set(aba);
    this.carregar();
  }

  enderecoCompleto(pedido: PedidoDto): string {
    return enderecoCompleto(pedido);
  }

  rotaDoMaps(pedido: PedidoDto): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto(pedido))}`;
  }

  iniciarRota(pedido: PedidoDto): void {
    this.navegando.set(pedido.id);
    window.setTimeout(() => {
      if (this.navegando() === pedido.id) {
        this.navegando.set(null);
      }
    }, 3000);
  }

  marcarEntregue(pedido: PedidoDto): void {
    if (!confirm(`Confirmar entrega do pedido #${pedido.id} para ${pedido.nomeCliente}?`)) {
      return;
    }

    this.erro.set(null);
    this.entregando.set(pedido.id);

    this.api.marcarEntregue(pedido.id).subscribe({
      next: () => {
        this.entregando.set(null);
        this.carregar();
      },
      error: erro => {
        this.entregando.set(null);
        this.erro.set(this.mensagem(erro, 'Não foi possível marcar como entregue.'));
      }
    });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.api
      .listar(this.aba() === 'para-entregar' ? { statusEntrega: 'Despachado' } : { statusEntrega: 'Entregue' })
      .subscribe({
        next: pedidos => {
          this.pedidos.set(pedidos ?? []);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os pedidos.');
          this.carregando.set(false);
        }
      });
  }

  private mensagem(erro: unknown, padrao: string): string {
    const doBackend = (erro as { error?: { message?: string } })?.error?.message;
    return typeof doBackend === 'string' && doBackend ? doBackend : padrao;
  }
}
