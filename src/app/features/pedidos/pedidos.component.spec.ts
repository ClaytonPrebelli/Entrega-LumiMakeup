import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PedidosComponent } from './pedidos.component';

const base = `${environment.urlDaApi}/api/entregas/pedidos`;

function pedido(id: number, sobre: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    nomeCliente: 'Ana',
    telefoneContato: '11999999999',
    status: 'Pago',
    metodoPagamento: 'Pix',
    subtotal: 58.7,
    desconto: 0,
    custoFrete: 0,
    total: 58.7,
    observacoes: null,
    criadoEm: '2026-10-01T10:00:00Z',
    enderecoCep: '18080-001',
    enderecoLogradouro: 'Rua A',
    enderecoNumero: '10',
    enderecoComplemento: null,
    enderecoBairro: 'Centro',
    enderecoCidade: 'Sorocaba',
    enderecoEstado: 'SP',
    itens: [],
    statusEntrega: 'Despachado',
    distanciaKm: 5,
    despachadoEm: '2026-10-02T10:00:00Z',
    entregueEm: null,
    entreguePorNome: null,
    ...sobre
  };
}

describe('PedidosComponent', () => {
  let fixture: ComponentFixture<PedidosComponent>;
  let component: PedidosComponent;
  let httpMock: HttpTestingController;

  function montar(): void {
    TestBed.configureTestingModule({
      imports: [PedidosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });

    fixture = TestBed.createComponent(PedidosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne(`${base}?statusEntrega=Despachado`).flush([pedido(1), pedido(2, { distanciaKm: 2 })]);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('ordena por menor distancia', () => {
    montar();

    expect(component.visiveis().map(p => p.id)).toEqual([2, 1]);
  });

  it('marca entregue apos confirmar', () => {
    montar();
    spyOn(window, 'confirm').and.returnValue(true);

    component.marcarEntregue(component.visiveis()[0]);

    const requisicao = httpMock.expectOne(`${base}/2/entregar`);
    expect(requisicao.request.method).toBe('POST');
    requisicao.flush(pedido(2, { statusEntrega: 'Entregue' }));

    expect(component.entregando()).toBeNull();
    httpMock.expectOne(`${base}?statusEntrega=Despachado`).flush([pedido(1)]);
    fixture.detectChanges();
    expect(component.visiveis().map(p => p.id)).toEqual([1]);
  });

  it('nao marca sem confirmacao', () => {
    montar();
    spyOn(window, 'confirm').and.returnValue(false);

    component.marcarEntregue(component.visiveis()[0]);

    httpMock.expectNone(`${base}/2/entregar`);
  });

  it('monta o link do maps com o endereco completo', () => {
    montar();

    const link = component.rotaDoMaps(component.visiveis()[0]);

    expect(link).toContain('https://www.google.com/maps/search/');
    expect(link).toContain(encodeURIComponent('Rua A, 10 - Centro - Sorocaba/SP'));
  });
});
