import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export type StatusEntrega = 'NaoEnviado' | 'Enviado' | 'Entregue' | 'Despachado';

export interface ItemDePedido {
  produtoId: number;
  varianteProdutoId?: number | null;
  varianteNome?: string | null;
  nome: string;
  quantidade: number;
  precoVendaUnitario: number;
  precoPromocionalUnitario: number | null;
  subtotal: number;
}

export interface PedidoDto {
  id: number;
  nomeCliente: string;
  telefoneContato: string | null;
  status: string;
  metodoPagamento: string | null;
  subtotal: number;
  desconto: number;
  custoFrete: number;
  total: number;
  observacoes: string | null;
  criadoEm: string;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoEstado: string | null;
  itens: ItemDePedido[];
  statusEntrega: StatusEntrega;
  distanciaKm: number;
  despachadoEm: string | null;
  entregueEm: string | null;
  entreguePorNome: string | null;
}

export interface EntregadorDto {
  id: number;
  nome: string;
  login: string | null;
  ativo: boolean;
  criadoEm: string;
}

/*
 * VERBOS: nada aqui usa PUT nem DELETE. POST com o verbo no fim da URL,
 * porque o servidor de producao nao encaminha PUT nem DELETE.
 */
@Injectable({ providedIn: 'root' })
export class EntregasService extends ApiService {
  listar(filtros: {
    statusEntrega?: StatusEntrega;
    de?: string;
    ate?: string;
    entregadorId?: number;
  } = {}): Observable<PedidoDto[]> {
    const parametros = new URLSearchParams();

    if (filtros.statusEntrega) {
      parametros.set('statusEntrega', filtros.statusEntrega);
    }

    if (filtros.de) {
      parametros.set('de', filtros.de);
    }

    if (filtros.ate) {
      parametros.set('ate', filtros.ate);
    }

    if (filtros.entregadorId !== undefined) {
      parametros.set('entregadorId', String(filtros.entregadorId));
    }

    const consulta = parametros.toString();
    return this.http.get<PedidoDto[]>(`${this.urlBase}/api/entregas/pedidos${consulta ? `?${consulta}` : ''}`);
  }

  marcarEntregue(id: number): Observable<PedidoDto> {
    return this.http.post<PedidoDto>(`${this.urlBase}/api/entregas/pedidos/${id}/entregar`, {});
  }

  /** Só para admin logado: lista entregadores para o filtro do relatório. */
  listarEntregadores(): Observable<EntregadorDto[]> {
    return this.http.get<EntregadorDto[]>(`${this.urlBase}/api/admin/entregadores`);
  }
}
