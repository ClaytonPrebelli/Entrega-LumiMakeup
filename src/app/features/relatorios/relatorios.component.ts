import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { EntregasService, EntregadorDto, PedidoDto } from '../../core/entregas.service';
import { exportarXls } from '../../shared/exportar-xls';

function hojeISO(): string {
  return new Date().toISOString().split('T')[0];
}

function inicioDoMesISO(): string {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0];
}

function enderecoCompleto(pedido: PedidoDto): string {
  const numero = pedido.enderecoNumero ? `, ${pedido.enderecoNumero}` : '';
  const complemento = pedido.enderecoComplemento ? ` - ${pedido.enderecoComplemento}` : '';
  const bairro = pedido.enderecoBairro ? ` - ${pedido.enderecoBairro}` : '';
  const cidade = pedido.enderecoCidade ? ` - ${pedido.enderecoCidade}/${pedido.enderecoEstado ?? ''}` : '';
  return `${pedido.enderecoLogradouro ?? ''}${numero}${complemento}${bairro}${cidade}`;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="container">
      <h1>Relatório de entregas</h1>

      @if (erro()) {
        <p class="alerta-erro">{{ erro() }}</p>
      }

      <section class="card filtros">
        <label>
          <span>De</span>
          <input class="input" type="date" name="de" [(ngModel)]="filtroDe" />
        </label>
        <label>
          <span>Até</span>
          <input class="input" type="date" name="ate" [(ngModel)]="filtroAte" />
        </label>
        @if (ehAdmin()) {
          <label>
            <span>Entregador</span>
            <select class="input" name="entregador" [(ngModel)]="filtroEntregador">
              <option [ngValue]="null">Todos</option>
              @for (entregador of entregadores(); track entregador.id) {
                <option [ngValue]="entregador.id">{{ entregador.nome }}</option>
              }
            </select>
          </label>
        }
        <div class="botoes">
          <button type="button" class="btn" (click)="carregar()" [disabled]="carregando()">
            {{ carregando() ? 'Filtrando…' : 'Filtrar' }}
          </button>
          <button
            type="button"
            class="btn btn-outline"
            (click)="exportar()"
            [disabled]="entregas().length === 0"
          >
            Exportar XLS
          </button>
        </div>
      </section>

      @if (!carregando()) {
        <section class="resumo">
          <div class="card">
            <strong>{{ entregas().length }}</strong>
            <span>entregas</span>
          </div>
          <div class="card">
            <strong>{{ totalKm() }} km</strong>
            <span>rodados</span>
          </div>
          <div class="card">
            <strong>{{ total() | currency: 'BRL' }}</strong>
            <span>em pedidos</span>
          </div>
        </section>

        @if (entregas().length === 0) {
          <p class="text-muted vazio">Nenhuma entrega no período.</p>
        } @else {
          <section class="card tabela">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Endereço</th>
                  <th>Bairro</th>
                  <th>Km</th>
                </tr>
              </thead>
              <tbody>
                @for (pedido of entregas(); track pedido.id) {
                  <tr>
                    <td>{{ pedido.entregueEm ? (pedido.entregueEm | date: 'dd/MM HH:mm') : '—' }}</td>
                    <td><strong>#{{ pedido.id }}</strong></td>
                    <td>{{ pedido.nomeCliente }}</td>
                    <td>{{ enderecoCompleto(pedido) }}</td>
                    <td>{{ pedido.enderecoBairro || '—' }}</td>
                    <td>{{ pedido.distanciaKm }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }
      }
    </div>
  `,
  styles: `
    h1 {
      font-size: 1.4rem;
      margin-bottom: 1rem;
    }

    .filtros {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      margin-bottom: 1rem;
    }

    .filtros label {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.9rem;
    }

    .botoes {
      display: flex;
      gap: 0.6rem;
    }

    .botoes .btn {
      flex: 1;
    }

    .resumo {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
      margin-bottom: 1rem;
    }

    .resumo .card {
      padding: 0.7rem 0.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
    }

    .resumo strong {
      font-size: 1rem;
    }

    .tabela {
      padding: 0.6rem;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    th,
    td {
      text-align: left;
      padding: 0.5rem 0.4rem;
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    th {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .vazio {
      text-align: center;
      padding: 2.5rem 1rem;
    }
  `
})
export class RelatoriosComponent implements OnInit {
  private readonly api = inject(EntregasService);
  private readonly autenticacao = inject(AutenticacaoService);

  readonly entregas = signal<PedidoDto[]>([]);
  readonly entregadores = signal<EntregadorDto[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  filtroDe = inicioDoMesISO();
  filtroAte = hojeISO();
  filtroEntregador: number | null = null;

  readonly ehAdmin = computed(() => this.autenticacao.usuario()?.papel === 'Administrador');

  readonly totalKm = computed(() =>
    Math.round(this.entregas().reduce((soma, p) => soma + p.distanciaKm, 0) * 100) / 100
  );

  readonly total = computed(() => this.entregas().reduce((soma, p) => soma + p.total, 0));

  ngOnInit(): void {
    if (this.ehAdmin()) {
      this.api.listarEntregadores().subscribe({
        next: lista => this.entregadores.set(lista ?? []),
        error: () => this.entregadores.set([])
      });
    }

    this.carregar();
  }

  enderecoCompleto(pedido: PedidoDto): string {
    return enderecoCompleto(pedido);
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.api
      .listar({
        statusEntrega: 'Entregue',
        de: this.filtroDe || undefined,
        ate: this.filtroAte || undefined,
        entregadorId: this.filtroEntregador ?? undefined
      })
      .subscribe({
        next: pedidos => {
          this.entregas.set(pedidos ?? []);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar o relatório.');
          this.carregando.set(false);
        }
      });
  }

  exportar(): void {
    exportarXls(
      `entregas-${this.filtroDe}-a-${this.filtroAte}`,
      this.entregas().map(p => ({
        Pedido: p.id,
        'Entregue em': p.entregueEm,
        Cliente: p.nomeCliente,
        Telefone: p.telefoneContato,
        Endereço: enderecoCompleto(p),
        Bairro: p.enderecoBairro,
        Cidade: p.enderecoCidade,
        'Distância km': p.distanciaKm,
        'Entregue por': p.entreguePorNome,
        Total: p.total,
        Pagamento: p.metodoPagamento
      }))
    );
  }
}
